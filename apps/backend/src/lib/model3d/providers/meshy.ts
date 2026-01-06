/**
 * Meshy 상용 API Provider (환경변수 기반 구성)
 *
 * Meshy의 API 스펙은 플랜/버전/문서에 따라 세부가 달라질 수 있어,
 * 엔드포인트/필드명 등을 환경 변수로 조절 가능하게 구성합니다.
 *
 * 필수 환경 변수:
 * - MODEL3D_PROVIDER=meshy
 * - MESHY_API_KEY=...
 *
 * 선택 환경 변수(기본값 제공):
 * - MESHY_API_BASE=https://api.meshy.ai
 * - MESHY_CREATE_PATH=/openapi/v1/image-to-3d
 * - MESHY_STATUS_PATH_TEMPLATE=/openapi/v1/image-to-3d/{id}
 * - MESHY_IMAGE_FIELD=image_url
 *
 * 멀티 이미지(1~4장) 사용 시:
 * - MESHY_MULTI_CREATE_PATH=/openapi/v1/multi-image-to-3d
 * - MESHY_MULTI_STATUS_PATH_TEMPLATE=/openapi/v1/multi-image-to-3d/{id}
 * - MESHY_MULTI_IMAGE_FIELD=image_urls
 *
 * - MESHY_RESULT_URL_FIELDS=model_urls.glb,model_urls.pre_remeshed_glb,model_urls.obj,model_urls.fbx,glb_url,gltf_url,model_url,output.glb,output.gltf
 *
 * 인증 헤더는 두 방식 모두 시도합니다:
 * - Authorization: Bearer <key>
 * - x-api-key: <key>
 */

export type MeshyTaskStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | string;

export interface MeshyTask {
  id?: string;
  task_id?: string;
  status?: MeshyTaskStatus;
  state?: MeshyTaskStatus;
  error?: unknown;
  message?: string;
  // 결과는 API마다 다르므로 unknown으로 둡니다.
  [key: string]: unknown;
}

const getEnv = (k: string, fallback?: string) => process.env[k] ?? fallback;

export const isMeshyConfigured = () => Boolean(process.env.MESHY_API_KEY);

const getRequiredEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} 환경 변수가 필요합니다`);
  return v;
};

const buildUrl = (base: string, path: string) => {
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

const getHeaders = () => {
  const key = getRequiredEnv('MESHY_API_KEY');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
    'x-api-key': key,
  } as Record<string, string>;
};

const readJson = async (res: Response): Promise<any> => {
  const text = await res.text().catch(() => '');
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

export const createMeshyTask = async (imageUrl: string, extraBody?: Record<string, unknown>): Promise<MeshyTask> => {
  const base = getEnv('MESHY_API_BASE', 'https://api.meshy.ai')!;
  const createPath = getEnv('MESHY_CREATE_PATH', '/openapi/v1/image-to-3d')!;
  const imageField = getEnv('MESHY_IMAGE_FIELD', 'image_url')!;

  const body: Record<string, unknown> = {
    [imageField]: imageUrl,
  };

  // 추가 옵션을 JSON 문자열로 주입 가능
  // 예: MESHY_EXTRA_BODY='{"quality":"high","texture":"pbr"}'
  if (process.env.MESHY_EXTRA_BODY) {
    try {
      const extra = JSON.parse(process.env.MESHY_EXTRA_BODY);
      if (extra && typeof extra === 'object') Object.assign(body, extra);
    } catch {
      // 무시
    }
  }

  // 작업별 옵션(우선)
  if (extraBody && typeof extraBody === 'object') {
    Object.assign(body, extraBody);
  }

  const res = await fetch(buildUrl(base, createPath), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const json = await readJson(res);
  if (!res.ok) {
    // Meshy 무료 플랜 제한 등(402)
    if (res.status === 402) {
      const msg =
        (json && typeof json.message === 'string' && json.message) ||
        'Meshy 플랜 제한으로 작업 생성이 거부되었습니다';
      throw new Error(
        `Meshy 플랜 업그레이드가 필요합니다(402). ${msg}`
      );
    }
    throw new Error(`Meshy 작업 생성 실패: ${res.status} ${JSON.stringify(json)}`);
  }
  return json as MeshyTask;
};

export const createMeshyMultiTask = async (imageUrls: string[]): Promise<MeshyTask> => {
  return createMeshyMultiTaskWithOptions(imageUrls);
};

export const createMeshyMultiTaskWithOptions = async (imageUrls: string[], extraBody?: Record<string, unknown>): Promise<MeshyTask> => {
  const base = getEnv('MESHY_API_BASE', 'https://api.meshy.ai')!;
  const createPath = getEnv('MESHY_MULTI_CREATE_PATH', '/openapi/v1/multi-image-to-3d')!;
  const imageField = getEnv('MESHY_MULTI_IMAGE_FIELD', 'image_urls')!;

  const body: Record<string, unknown> = {
    [imageField]: imageUrls,
  };

  if (process.env.MESHY_EXTRA_BODY) {
    try {
      const extra = JSON.parse(process.env.MESHY_EXTRA_BODY);
      if (extra && typeof extra === 'object') Object.assign(body, extra);
    } catch {
      // 무시
    }
  }

  if (extraBody && typeof extraBody === 'object') {
    Object.assign(body, extraBody);
  }

  const res = await fetch(buildUrl(base, createPath), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const json = await readJson(res);
  if (!res.ok) {
    if (res.status === 402) {
      const msg =
        (json && typeof json.message === 'string' && json.message) ||
        'Meshy 플랜 제한으로 작업 생성이 거부되었습니다';
      throw new Error(`Meshy 플랜 업그레이드가 필요합니다(402). ${msg}`);
    }
    throw new Error(`Meshy 작업 생성 실패: ${res.status} ${JSON.stringify(json)}`);
  }

  return json as MeshyTask;
};

export const getMeshyTask = async (taskId: string, taskType: 'single' | 'multi' = 'single'): Promise<MeshyTask> => {
  const base = getEnv('MESHY_API_BASE', 'https://api.meshy.ai')!;
  const template =
    taskType === 'multi'
      ? getEnv('MESHY_MULTI_STATUS_PATH_TEMPLATE', '/openapi/v1/multi-image-to-3d/{id}')!
      : getEnv('MESHY_STATUS_PATH_TEMPLATE', '/openapi/v1/image-to-3d/{id}')!;
  const path = template.replace('{id}', encodeURIComponent(taskId));

  const res = await fetch(buildUrl(base, path), {
    method: 'GET',
    headers: getHeaders(),
  });

  const json = await readJson(res);
  if (!res.ok) {
    throw new Error(`Meshy 상태 조회 실패: ${res.status} ${JSON.stringify(json)}`);
  }
  return json as MeshyTask;
};

const getByPath = (obj: unknown, dottedPath: string): unknown => {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = dottedPath.split('.').filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
};

export const extractMeshyTaskId = (task: MeshyTask): string | null => {
  const anyTask = task as any;
  // Meshy 응답이 { id } / { task_id } / { result: "<id>" } 등으로 올 수 있어 모두 지원
  const id = anyTask.id ?? anyTask.task_id ?? anyTask.result ?? anyTask.data?.id ?? anyTask.data?.task_id;
  return typeof id === 'string' && id.length ? id : null;
};

export const extractMeshyStatus = (task: MeshyTask): MeshyTaskStatus => {
  const anyTask = task as any;
  // status/state 외에도 result.status, data.status 같은 형태가 있을 수 있음
  return (anyTask.status ?? anyTask.state ?? anyTask.data?.status ?? anyTask.result?.status ?? 'processing') as MeshyTaskStatus;
};

export const extractModelUrlFromMeshy = (task: MeshyTask): string | null => {
  const fieldsRaw = getEnv(
    'MESHY_RESULT_URL_FIELDS',
    'model_urls.glb,model_urls.pre_remeshed_glb,model_urls.obj,model_urls.fbx,glb_url,gltf_url,model_url,output.glb,output.gltf'
  )!;
  const fields = fieldsRaw.split(',').map((s) => s.trim()).filter(Boolean);

  for (const f of fields) {
    const v = getByPath(task, f);
    if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))) {
      return v;
    }
  }

  // fallback: 가장 흔한 케이스(배열/객체)
  const anyTask = task as any;
  const candidates: unknown[] = [];
  if (anyTask.output) candidates.push(anyTask.output);
  if (anyTask.result) candidates.push(anyTask.result);
  if (anyTask.data) candidates.push(anyTask.data);

  const scan = (x: unknown): string | null => {
    if (!x) return null;
    if (typeof x === 'string' && (x.startsWith('http://') || x.startsWith('https://'))) return x;
    if (Array.isArray(x)) {
      for (const it of x) {
        const found = scan(it);
        if (found) return found;
      }
    }
    if (typeof x === 'object') {
      for (const key of Object.keys(x as any)) {
        const found = scan((x as any)[key]);
        if (found) return found;
      }
    }
    return null;
  };

  for (const c of candidates) {
    const found = scan(c);
    if (found) return found;
  }

  return null;
};


