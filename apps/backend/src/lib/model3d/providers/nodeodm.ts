/**
 * Photogrammetry Provider: NodeODM(OpenDroneMap) 연동
 *
 * 동작 방식:
 * - 여러 장의 이미지 URL을 받아 NodeODM로 업로드하여 task 생성
 * - 상태 조회로 완료 시 결과 ZIP 다운로드 → OBJ를 GLB로 변환 → 로컬 모델로 서빙
 *
 * 필요한 환경 변수:
 * - MODEL3D_PROVIDER=photogrammetry
 * - PHOTOGRAMMETRY_ENGINE=nodeodm
 * - NODEODM_URL=http://localhost:3002 (예시)
 *
 * 선택:
 * - NODEODM_CREATE_PATH=/task/new
 * - NODEODM_INFO_PATH_TEMPLATE=/task/{id}/info
 * - NODEODM_DOWNLOAD_ZIP_TEMPLATE=/task/{id}/download/all.zip
 * - NODEODM_OPTIONS_JSON='{"feature-quality":"high","pc-quality":"high"}'
 */

import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';

// obj2gltf는 CJS 패키지이지만, 이 프로젝트 런타임은 ESM이라 require를 쓸 수 없습니다.
// dynamic import로 로드한 뒤 default 유무를 흡수합니다.
let obj2gltfFn: any | null = null;
const getObj2Gltf = async () => {
  if (obj2gltfFn) return obj2gltfFn;
  const mod: any = await import('obj2gltf');
  obj2gltfFn = mod?.default ?? mod;
  return obj2gltfFn;
};

export type NodeOdmTaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
  | string;

export interface NodeOdmTaskInfo {
  uuid?: string;
  id?: string;
  status?: NodeOdmTaskStatus;
  error?: unknown;
  progress?: number;
  // 기타 필드
  [key: string]: unknown;
}

const getEnv = (k: string, fallback?: string) => process.env[k] ?? fallback;

export const isNodeOdmConfigured = () => Boolean(process.env.NODEODM_URL);

const buildUrl = (base: string, p: string) => {
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = p.startsWith('/') ? p : `/${p}`;
  return `${cleanBase}${cleanPath}`;
};

const readJson = async (res: Response): Promise<any> => {
  const text = await res.text().catch(() => '');
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

export const createNodeOdmTask = async (imageUrls: string[]): Promise<{ taskId: string }> => {
  const base = getEnv('NODEODM_URL')!;
  const createPath = getEnv('NODEODM_CREATE_PATH', '/task/new')!;

  const form = new FormData();
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]!;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`NodeODM 업로드용 이미지 다운로드 실패: ${resp.status}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    const mime = resp.headers.get('content-type') || 'image/jpeg';
    const ext = mime.includes('png') ? 'png' : 'jpg';
    form.append('images', new Blob([buf], { type: mime }), `image_${i + 1}.${ext}`);
  }

  // NodeODM options: JSON 문자열로 전달(엔진 설정)
  const optionsRaw = getEnv('NODEODM_OPTIONS_JSON');
  if (optionsRaw) {
    form.append('options', optionsRaw);
  }

  const res = await fetch(buildUrl(base, createPath), {
    method: 'POST',
    body: form as any,
  });

  const json = await readJson(res);
  if (!res.ok) {
    throw new Error(`NodeODM 작업 생성 실패: ${res.status} ${JSON.stringify(json)}`);
  }

  const taskId = json.uuid || json.id;
  if (!taskId || typeof taskId !== 'string') {
    throw new Error(`NodeODM task id를 찾지 못했습니다: ${JSON.stringify(json)}`);
  }
  return { taskId };
};

export const getNodeOdmTaskInfo = async (taskId: string): Promise<NodeOdmTaskInfo> => {
  const base = getEnv('NODEODM_URL')!;
  const template = getEnv('NODEODM_INFO_PATH_TEMPLATE', '/task/{id}/info')!;
  const p = template.replace('{id}', encodeURIComponent(taskId));

  const res = await fetch(buildUrl(base, p), { method: 'GET' });
  const json = await readJson(res);
  if (!res.ok) throw new Error(`NodeODM 상태 조회 실패: ${res.status} ${JSON.stringify(json)}`);
  return json as NodeOdmTaskInfo;
};

export const downloadNodeOdmZip = async (taskId: string, outZipPath: string) => {
  const base = getEnv('NODEODM_URL')!;
  const template = getEnv('NODEODM_DOWNLOAD_ZIP_TEMPLATE', '/task/{id}/download/all.zip')!;
  const p = template.replace('{id}', encodeURIComponent(taskId));
  const url = buildUrl(base, p);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`NodeODM 결과 ZIP 다운로드 실패: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(outZipPath, buf);
};

export const unzipToDir = async (zipPath: string, outDir: string) => {
  await fs.promises.mkdir(outDir, { recursive: true });
  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: outDir }))
    .promise();
};

export const findFirstObj = async (dir: string): Promise<string | null> => {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = await fs.promises.readdir(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      if (e.isFile() && e.name.toLowerCase().endsWith('.obj')) return p;
    }
  }
  return null;
};

export const convertObjToGlb = async (objPath: string, outGlbPath: string) => {
  const obj2gltf = await getObj2Gltf();
  const glb = await obj2gltf(objPath, { binary: true });
  await fs.promises.writeFile(outGlbPath, glb);
};


