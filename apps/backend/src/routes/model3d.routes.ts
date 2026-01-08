import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { createApiResponse, createErrorResponse } from '@side-project/shared';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import cloudinary from '../lib/cloudinary.js';
import { createMockTriangleGltfJson } from '../lib/model3d/mockGltf.js';
import {
  createReplicatePrediction,
  extractModelUrlFromOutput,
  getReplicatePrediction,
  isReplicateConfigured,
} from '../lib/model3d/providers/replicate.js';
import {
  createMeshyTask,
  createMeshyMultiTask,
  createMeshyMultiTaskWithOptions,
  extractMeshyStatus,
  extractMeshyTaskId,
  extractModelUrlFromMeshy,
  getMeshyTask,
  isMeshyConfigured,
} from '../lib/model3d/providers/meshy.js';
import {
  convertObjToGlb,
  createNodeOdmTask,
  downloadNodeOdmZip,
  findFirstObj,
  getNodeOdmTaskInfo,
  isNodeOdmConfigured,
  unzipToDir,
} from '../lib/model3d/providers/nodeodm.js';

const router: IRouter = Router();

// 업로드는 넉넉히 받되, provider별로 사용하는 장수는 다를 수 있습니다.
// - Meshy Multi: 1~4
// - Photogrammetry(NodeODM): 20~80 권장 (여기서는 60으로 제한)
const MAX_IMAGES = 60;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer 설정 (메모리 저장소)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_IMAGES + 1, // images + textureImage(선택)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다'));
    }
  },
});

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getBaseUrl = (req: Request) => {
  // 배포 환경에서는 고정 URL을 쓰고, 로컬에서는 요청 기반으로 계산
  const envUrl = process.env.BACKEND_PUBLIC_URL;
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    return envUrl.replace(/\/$/, '');
  }
  return `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
};

const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // 3D 입력은 원본 보존이 중요하므로 강한 크롭/리사이즈 변환을 하지 않습니다.
        transformation: [{ quality: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary 업로드 실패'));
        resolve(result.secure_url);
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

const saveToLocalUploads = async (buffer: Buffer, filename: string, baseUrl: string) => {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const inputsDir = path.join(uploadsRoot, '3d-inputs');
  ensureDir(inputsDir);
  const fullPath = path.join(inputsDir, filename);
  await fs.promises.writeFile(fullPath, buffer);
  return `${baseUrl}/uploads/3d-inputs/${encodeURIComponent(filename)}`;
};

const uploadInputImage = async (buffer: Buffer, baseUrl: string, ext: string = 'png', folder: string = '3d-inputs') => {
  const fileName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, folder);
  }
  return saveToLocalUploads(buffer, fileName, baseUrl);
};

const writeMockModelFile = async (jobId: string) => {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const modelsDir = path.join(uploadsRoot, 'models');
  ensureDir(modelsDir);
  const modelPath = path.join(modelsDir, `${jobId}.gltf`);
  await fs.promises.writeFile(modelPath, createMockTriangleGltfJson(), 'utf-8');
  return modelPath;
};

const downloadToLocalModels = async (jobId: string, url: string) => {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const modelsDir = path.join(uploadsRoot, 'models');
  ensureDir(modelsDir);

  const parsed = new URL(url);
  const pathname = parsed.pathname.toLowerCase();
  const ext = pathname.endsWith('.glb') ? 'glb' : pathname.endsWith('.gltf') ? 'gltf' : 'glb';
  const outPath = path.join(modelsDir, `${jobId}.${ext}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`모델 다운로드 실패: ${res.status}`);
  }

  const arrayBuf = await res.arrayBuffer();
  await fs.promises.writeFile(outPath, Buffer.from(arrayBuf));
  return { outPath, ext };
};

const parseInputUrls = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeProgressPercent = (raw: unknown): number | null => {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
  // NodeODM은 0~1 또는 0~100 형태로 올 수 있어 안전하게 정규화합니다.
  const percent = raw <= 1 ? raw * 100 : raw;
  const clamped = Math.max(0, Math.min(100, percent));
  return Math.round(clamped);
};

const normalizeProviderStatusString = (raw: unknown): string => {
  if (typeof raw === 'string') return raw.toUpperCase();
  if (raw && typeof raw === 'object') {
    const o = raw as any;
    // 다양한 provider 응답 형태를 최대한 흡수합니다.
    const candidate =
      o.status ??
      o.state ??
      o.name ??
      o.code ??
      o.type ??
      o.value;
    if (typeof candidate === 'string') return candidate.toUpperCase();
    if (typeof candidate === 'number') return String(candidate);
  }
  return String(raw ?? '').toUpperCase();
};

const normalizeNodeOdmStatus = (raw: unknown): string => {
  // NodeODM /task/{id}/info는 status가 {"code": 40} 형태로 오기도 합니다.
  // 이 경우 숫자 코드를 사람이 읽을 수 있는 상태 문자열로 매핑합니다.
  if (raw && typeof raw === 'object') {
    const code = (raw as any).code;
    if (typeof code === 'number') {
      switch (code) {
        case 10:
          return 'QUEUED';
        case 20:
          return 'RUNNING';
        case 30:
          return 'FAILED';
        case 40:
          return 'COMPLETED';
        case 50:
          return 'CANCELED';
        default:
          return `CODE_${code}`;
      }
    }
  }
  // 문자열/기타는 범용 정규화로 처리
  return normalizeProviderStatusString(raw);
};

const formatJob = (job: any) => {
  return {
    id: job.id,
    status: job.status,
    provider: job.provider,
    providerJobId: job.providerJobId ?? null,
    providerStatus: typeof job.providerStatus === 'string' ? job.providerStatus : null,
    providerLastError: typeof job.providerLastError === 'string' ? job.providerLastError : null,
    lastCheckedAt: typeof job.lastCheckedAt === 'string' ? job.lastCheckedAt : null,
    inputImageUrls: parseInputUrls(job.inputImageUrls),
    outputModelUrl: job.outputModelUrl,
    errorMessage: job.errorMessage,
    progress: typeof job.progress === 'number' ? job.progress : null,
    texturePrompt: job.texturePrompt,
    textureImageUrl: job.textureImageUrl,
    enablePbr: job.enablePbr,
    shouldRemesh: job.shouldRemesh,
    targetPolycount: job.targetPolycount,
    symmetryMode: job.symmetryMode,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    updatedAt: job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt,
  };
};

type SocketServerLike = {
  to: (room: string) => { emit: (event: string, payload: any) => void };
};

const emitJobUpdate = (io: SocketServerLike | undefined, userId: string, job: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('model3d:job', { job: formatJob(job) });
};

/**
 * provider 상태를 조회해서 DB job을 갱신합니다.
 * - 프론트가 폴링(GET /jobs/:id)을 하고 있으므로, 요청 시점에 최신 상태로 업데이트하는 방식
 * - Meshy처럼 5분 이상 걸릴 수 있는 작업도 백엔드 타임아웃 없이 처리 가능
 */
const refreshJobIfNeeded = async (job: any, baseUrl: string, io?: SocketServerLike) => {
  // 이미 완료된 작업은 갱신 불필요
  if (job.status === 'SUCCEEDED' || job.status === 'FAILED') return job;

  const checkedAt = new Date().toISOString();

  // providerJobId가 아직 없으면(방금 생성 직후), 상태 조회를 시도하지 않고 그대로 유지합니다.
  // 백그라운드 startJobAsync가 providerJobId를 채운 뒤부터 provider 상태를 갱신합니다.
  if (!job.providerJobId) {
    // 진행중 상태에서 과거의 errorMessage가 남아있으면 제거(오판/이전 실패 메시지 잔존 방지)
    if (job.errorMessage) {
      const updated = await prisma.model3DJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', errorMessage: null },
      });
      (updated as any).providerStatus = 'CREATING_TASK';
      (updated as any).providerLastError = null;
      (updated as any).lastCheckedAt = checkedAt;
      emitJobUpdate(io, job.userId, updated);
      return updated;
    }
    // status가 비어있거나 이상하면 PROCESSING으로 정리
    if (job.status !== 'PROCESSING' && job.status !== 'PENDING') {
      const updated = await prisma.model3DJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', errorMessage: null },
      });
      (updated as any).providerStatus = 'CREATING_TASK';
      (updated as any).providerLastError = null;
      (updated as any).lastCheckedAt = checkedAt;
      emitJobUpdate(io, job.userId, updated);
      return updated;
    }
    (job as any).providerStatus = 'CREATING_TASK';
    (job as any).providerLastError = null;
    (job as any).lastCheckedAt = checkedAt;
    return job;
  }

  // mock은 백그라운드에서 바로 만들어도 되지만, 혹시 PROCESSING으로 남아있으면 즉시 완료 처리
  if (job.provider === 'mock') {
    await writeMockModelFile(job.id);
    const modelUrl = `${baseUrl}/uploads/models/${encodeURIComponent(job.id)}.gltf`;
    const updated = await prisma.model3DJob.update({
      where: { id: job.id },
      data: { status: 'SUCCEEDED', outputModelUrl: modelUrl, errorMessage: null },
    });
    emitJobUpdate(io, job.userId, updated);
    return updated;
  }

  // Meshy
  if (job.provider === 'meshy' && isMeshyConfigured()) {
    try {
      const inputUrls = parseInputUrls(job.inputImageUrls);
      const taskType: 'single' | 'multi' = inputUrls.length >= 2 ? 'multi' : 'single';
      const cur = await getMeshyTask(job.providerJobId, taskType);
      const rawStatus = extractMeshyStatus(cur);
      const status = String(rawStatus).toLowerCase();

      if (status === 'failed' || status === 'error' || status === 'canceled' || status === 'cancelled') {
        const updated = await prisma.model3DJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: typeof (cur as any).message === 'string' ? (cur as any).message : '3D 생성에 실패했습니다(Meshy)',
          },
        });
        (updated as any).providerStatus = normalizeProviderStatusString(rawStatus);
        (updated as any).providerLastError = null;
        (updated as any).lastCheckedAt = checkedAt;
        emitJobUpdate(io, job.userId, updated);
        return updated;
      }

      if (status === 'succeeded' || status === 'success' || status === 'completed' || status === 'done') {
        // 이미 저장된 결과가 있으면 그대로
        if (job.outputModelUrl) return job;

        const modelSourceUrl = extractModelUrlFromMeshy(cur);
        if (!modelSourceUrl) {
          const updated = await prisma.model3DJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', errorMessage: `Meshy 결과 모델 URL을 찾지 못했습니다: ${JSON.stringify(cur)}` },
          });
          (updated as any).providerStatus = normalizeProviderStatusString(rawStatus);
          (updated as any).providerLastError = null;
          (updated as any).lastCheckedAt = checkedAt;
          emitJobUpdate(io, job.userId, updated);
          return updated;
        }

        const { ext } = await downloadToLocalModels(job.id, modelSourceUrl);
        const modelUrl = `${baseUrl}/uploads/models/${encodeURIComponent(job.id)}.${ext}`;
        const updated = await prisma.model3DJob.update({
          where: { id: job.id },
          data: { status: 'SUCCEEDED', outputModelUrl: modelUrl, errorMessage: null },
        });
        (updated as any).providerStatus = normalizeProviderStatusString(rawStatus);
        (updated as any).providerLastError = null;
        (updated as any).lastCheckedAt = checkedAt;
        emitJobUpdate(io, job.userId, updated);
        return updated;
      }

      // 아직 진행 중이면 갱신
      // Meshy 문서 상 status 값 예: PENDING, IN_PROGRESS, SUCCEEDED...
      const updated = await prisma.model3DJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', errorMessage: null },
      });
      (updated as any).providerStatus = normalizeProviderStatusString(rawStatus);
      (updated as any).providerLastError = null;
      (updated as any).lastCheckedAt = checkedAt;
      emitJobUpdate(io, job.userId, updated);
      return updated;
    } catch (e: any) {
      (job as any).providerStatus = 'POLLING_ERROR';
      (job as any).providerLastError = e?.message || 'provider 상태 조회 중 오류가 발생했습니다';
      (job as any).lastCheckedAt = checkedAt;
      return job;
    }
  }

  // Photogrammetry(NodeODM)
  if (job.provider === 'photogrammetry' && isNodeOdmConfigured()) {
    try {
      const info = await getNodeOdmTaskInfo(job.providerJobId);
      const status = normalizeNodeOdmStatus((info as any).status);
      const progress = normalizeProgressPercent((info as any).progress);

      if (status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED') {
        const updated = await prisma.model3DJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: typeof (info as any).error === 'string' ? (info as any).error : 'Photogrammetry 처리에 실패했습니다(NodeODM)',
          },
        });
        (updated as any).progress = progress;
        (updated as any).providerStatus = status;
        (updated as any).providerLastError = null;
        (updated as any).lastCheckedAt = checkedAt;
        emitJobUpdate(io, job.userId, updated);
        return updated;
      }

      if (status === 'COMPLETED' || status === 'SUCCEEDED') {
        if (job.outputModelUrl) return job;

        const uploadsRoot = path.join(process.cwd(), 'uploads');
        const tmpDir = path.join(uploadsRoot, 'photogrammetry', job.id);
        ensureDir(tmpDir);
        const zipPath = path.join(tmpDir, 'result.zip');
        await downloadNodeOdmZip(job.providerJobId, zipPath);
        const extractedDir = path.join(tmpDir, 'extracted');
        await unzipToDir(zipPath, extractedDir);

        const objPath = await findFirstObj(extractedDir);
        if (!objPath) {
          const updated = await prisma.model3DJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', errorMessage: 'NodeODM 결과에서 OBJ 파일을 찾지 못했습니다' },
          });
          (updated as any).progress = progress;
          (updated as any).providerStatus = status;
          (updated as any).providerLastError = null;
          (updated as any).lastCheckedAt = checkedAt;
          emitJobUpdate(io, job.userId, updated);
          return updated;
        }

        const modelsDir = path.join(uploadsRoot, 'models');
        ensureDir(modelsDir);
        const outGlbPath = path.join(modelsDir, `${job.id}.glb`);
        await convertObjToGlb(objPath, outGlbPath);
        const modelUrl = `${baseUrl}/uploads/models/${encodeURIComponent(job.id)}.glb`;

        const updated = await prisma.model3DJob.update({
          where: { id: job.id },
          data: { status: 'SUCCEEDED', outputModelUrl: modelUrl, errorMessage: null },
        });
        (updated as any).progress = 100;
        (updated as any).providerStatus = status;
        (updated as any).providerLastError = null;
        (updated as any).lastCheckedAt = checkedAt;
        emitJobUpdate(io, job.userId, updated);
        return updated;
      }

      const updated = await prisma.model3DJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', errorMessage: null },
      });
      (updated as any).progress = progress;
      (updated as any).providerStatus = status;
      (updated as any).providerLastError = null;
      (updated as any).lastCheckedAt = checkedAt;
      emitJobUpdate(io, job.userId, updated);
      return updated;
    } catch (e: any) {
      (job as any).providerStatus = 'POLLING_ERROR';
      (job as any).providerLastError = e?.message || 'provider 상태 조회 중 오류가 발생했습니다';
      (job as any).lastCheckedAt = checkedAt;
      return job;
    }
  }

  // Replicate
  if (job.provider === 'replicate' && isReplicateConfigured()) {
    try {
      const cur = await getReplicatePrediction(job.providerJobId);
      const providerStatus = normalizeProviderStatusString(cur.status);
      if (cur.status === 'failed' || cur.status === 'canceled') {
        const updated = await prisma.model3DJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorMessage: typeof cur.error === 'string' ? cur.error : '3D 생성에 실패했습니다(Replicate)',
          },
        });
        (updated as any).providerStatus = providerStatus;
        (updated as any).providerLastError = null;
        (updated as any).lastCheckedAt = checkedAt;
        emitJobUpdate(io, job.userId, updated);
        return updated;
      }
      if (cur.status === 'succeeded') {
        if (job.outputModelUrl) return job;
        const modelSourceUrl = extractModelUrlFromOutput(cur.output);
        if (!modelSourceUrl) {
          const updated = await prisma.model3DJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', errorMessage: '결과 모델 URL을 찾지 못했습니다(Replicate output)' },
          });
          (updated as any).providerStatus = providerStatus;
          (updated as any).providerLastError = null;
          (updated as any).lastCheckedAt = checkedAt;
          emitJobUpdate(io, job.userId, updated);
          return updated;
        }
        const { ext } = await downloadToLocalModels(job.id, modelSourceUrl);
        const modelUrl = `${baseUrl}/uploads/models/${encodeURIComponent(job.id)}.${ext}`;
        const updated = await prisma.model3DJob.update({
          where: { id: job.id },
          data: { status: 'SUCCEEDED', outputModelUrl: modelUrl, errorMessage: null },
        });
        (updated as any).providerStatus = providerStatus;
        (updated as any).providerLastError = null;
        (updated as any).lastCheckedAt = checkedAt;
        emitJobUpdate(io, job.userId, updated);
        return updated;
      }
      const updated = await prisma.model3DJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', errorMessage: null },
      });
      (updated as any).providerStatus = providerStatus;
      (updated as any).providerLastError = null;
      (updated as any).lastCheckedAt = checkedAt;
      emitJobUpdate(io, job.userId, updated);
      return updated;
    } catch (e: any) {
      (job as any).providerStatus = 'POLLING_ERROR';
      (job as any).providerLastError = e?.message || 'provider 상태 조회 중 오류가 발생했습니다';
      (job as any).lastCheckedAt = checkedAt;
      return job;
    }
  }

  // provider 설정이 불완전하면 실패 처리(안전)
  const updated = await prisma.model3DJob.update({
    where: { id: job.id },
    data: { status: 'FAILED', errorMessage: '3D Provider 설정이 올바르지 않습니다' },
  });
  (updated as any).providerStatus = 'MISCONFIGURED';
  (updated as any).providerLastError = null;
  (updated as any).lastCheckedAt = checkedAt;
  emitJobUpdate(io, job.userId, updated);
  return updated;
};

/**
 * 작업 시작(비동기) - provider task 생성까지만 수행하고, 결과 완료/다운로드는 GET 조회 시점에 처리합니다.
 */
const startJobAsync = async (jobId: string, baseUrl: string) => {
  try {
    const job = await prisma.model3DJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    // 이미 providerJobId가 있으면 재시도 불필요
    if (job.providerJobId) return;

    const inputUrls = parseInputUrls(job.inputImageUrls);
    const primaryImageUrl = inputUrls[0];
    if (!primaryImageUrl) throw new Error('입력 이미지 URL이 없습니다');

    if (job.provider === 'meshy' && isMeshyConfigured()) {
      const extraBody: Record<string, unknown> = {};
      // 문서: texture_prompt/texture_image_url은 should_texture=true 필요
      const wantsTextureGuide = Boolean(job.texturePrompt || job.textureImageUrl);
      if (wantsTextureGuide) {
        extraBody.should_texture = true;
      }
      if (job.enablePbr) {
        extraBody.enable_pbr = true;
      }
      if (job.texturePrompt) {
        extraBody.texture_prompt = job.texturePrompt;
      } else if (job.textureImageUrl) {
        extraBody.texture_image_url = job.textureImageUrl;
      }
      // geometry 옵션
      extraBody.should_remesh = job.shouldRemesh;
      if (job.targetPolycount != null) extraBody.target_polycount = job.targetPolycount;
      if (job.symmetryMode) extraBody.symmetry_mode = job.symmetryMode;

      // Meshy 멀티 이미지(1~4장): 2장 이상이면 멀티 엔드포인트 사용
      const meshysInput = inputUrls.slice(0, 4);
      const task =
        meshysInput.length >= 2
          ? await createMeshyMultiTaskWithOptions(meshysInput, extraBody)
          : await createMeshyTask(primaryImageUrl, extraBody);
      const taskId = extractMeshyTaskId(task);
      if (!taskId) throw new Error(`Meshy 작업 ID를 찾지 못했습니다: ${JSON.stringify(task)}`);
      await prisma.model3DJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', providerJobId: taskId, errorMessage: null },
      });
      return;
    }

    if (job.provider === 'photogrammetry') {
      if (!isNodeOdmConfigured()) {
        throw new Error('Photogrammetry 엔진(NodeODM) 설정이 필요합니다: NODEODM_URL');
      }
      const urls = inputUrls.slice(0, MAX_IMAGES);
      // 실사용 권장치(대략): 20장 이상
      if (urls.length < 8) {
        throw new Error('Photogrammetry는 최소 8장 이상(권장 20장+) 이미지가 필요합니다');
      }
      const { taskId } = await createNodeOdmTask(urls);
      await prisma.model3DJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', providerJobId: taskId, errorMessage: null },
      });
      return;
    }

    if (job.provider === 'replicate' && isReplicateConfigured()) {
      const prediction = await createReplicatePrediction(primaryImageUrl);
      await prisma.model3DJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', providerJobId: prediction.id, errorMessage: null },
      });
      return;
    }

    // mock은 즉시 생성해도 OK
    if (job.provider === 'mock') {
      await writeMockModelFile(jobId);
      const modelUrl = `${baseUrl}/uploads/models/${encodeURIComponent(jobId)}.gltf`;
      await prisma.model3DJob.update({
        where: { id: jobId },
        data: { status: 'SUCCEEDED', outputModelUrl: modelUrl, errorMessage: null },
      });
    }
  } catch (e: any) {
    await prisma.model3DJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: e?.message || '3D 변환에 실패했습니다' },
    });
  }
};

/**
 * POST /api/3d/jobs
 * - 이미지(1~8장) 업로드 후 3D 변환 작업(Job)을 생성합니다.
 * - 현재는 데모용 mock glTF를 생성합니다(외부 3D 서비스 키가 없어도 동작).
 */
router.post(
  '/jobs',
  authenticate,
  upload.fields([
    { name: 'images', maxCount: MAX_IMAGES },
    { name: 'textureImage', maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = ((req.files as any)?.images || []) as Express.Multer.File[];
      const textureImageFile = (((req.files as any)?.textureImage || []) as Express.Multer.File[])[0];
      if (!files.length) {
        return res.status(400).json(createErrorResponse('이미지 파일이 필요합니다', 'MISSING_FILES'));
      }
      if (files.length > MAX_IMAGES) {
        return res.status(400).json(
          createErrorResponse(`최대 ${MAX_IMAGES}장까지 업로드 가능합니다`, 'TOO_MANY_FILES')
        );
      }

      const baseUrl = getBaseUrl(req);
      const inputUrls = await Promise.all(files.map((f) => {
        const ext = (f.mimetype?.split('/')?.[1] || 'png').replace('jpeg', 'jpg');
        return uploadInputImage(f.buffer, baseUrl, ext, '3d-inputs');
      }));

      // 작업별 텍스처 가이드(선택)
      const texturePrompt = typeof req.body.texturePrompt === 'string' ? req.body.texturePrompt.trim() : '';
      const enablePbr = String(req.body.enablePbr || '').toLowerCase() === 'true';
      const shouldRemesh = req.body.shouldRemesh == null ? true : String(req.body.shouldRemesh).toLowerCase() === 'true';
      const targetPolycountRaw = req.body.targetPolycount;
      const targetPolycount = typeof targetPolycountRaw === 'string' && targetPolycountRaw.trim()
        ? Number(targetPolycountRaw)
        : undefined;
      const symmetryMode = typeof req.body.symmetryMode === 'string' ? req.body.symmetryMode : undefined;

      let textureImageUrl: string | undefined;
      if (textureImageFile) {
        const ext = (textureImageFile.mimetype?.split('/')?.[1] || 'png').replace('jpeg', 'jpg');
        textureImageUrl = await uploadInputImage(textureImageFile.buffer, baseUrl, ext, '3d-texture-inputs');
      }

      // Meshy 문서: texture_prompt와 texture_image_url 동시 제공 시 prompt가 우선.
      // UX 관점에서 둘 다 들어오면 prompt를 우선으로 사용하고, textureImageUrl은 저장만 합니다.

      const job = await prisma.model3DJob.create({
        data: {
          userId: req.user!.userId,
          status: 'PROCESSING',
          provider:
            process.env.MODEL3D_PROVIDER === 'meshy'
              ? 'meshy'
              : process.env.MODEL3D_PROVIDER === 'photogrammetry'
              ? 'photogrammetry'
              : process.env.MODEL3D_PROVIDER === 'replicate'
              ? 'replicate'
              : 'mock',
          inputImageUrls: JSON.stringify(inputUrls),
          texturePrompt: texturePrompt || null,
          textureImageUrl: textureImageUrl || null,
          enablePbr,
          shouldRemesh,
          targetPolycount: Number.isFinite(targetPolycount) ? targetPolycount : null,
          symmetryMode: symmetryMode || null,
        },
      });

      // 비동기 처리(요청을 오래 잡고 있지 않도록): provider task 생성까지만 수행
      setImmediate(() => {
        startJobAsync(job.id, baseUrl);
      });

      return res.json(
        createApiResponse({
          job: formatJob(job),
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/3d/jobs/:id
 * - 작업 상태 및 결과(모델 URL)를 조회합니다.
 */
router.get('/jobs/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const job = await prisma.model3DJob.findUnique({ where: { id } });
    if (!job || job.userId !== req.user!.userId) {
      return res.status(404).json(createErrorResponse('작업을 찾을 수 없습니다', 'JOB_NOT_FOUND'));
    }

    const baseUrl = getBaseUrl(req);
    const io = req.app.get('io') as SocketServerLike | undefined;
    const refreshed = await refreshJobIfNeeded(job, baseUrl, io);
    return res.json(createApiResponse({ job: formatJob(refreshed) }));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/3d/jobs
 * - 내 작업 목록을 조회합니다.
 */
router.get('/jobs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.model3DJob.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json(createApiResponse({ jobs: jobs.map(formatJob) }));
  } catch (error) {
    next(error);
  }
});

export { router as model3dRoutes };


