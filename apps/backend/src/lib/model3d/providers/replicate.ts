/**
 * Replicate 기반 이미지 → 3D 생성 Provider
 *
 * 주의:
 * - Replicate에서 사용하는 모델/버전/입력 파라미터는 모델마다 다를 수 있어
 *   환경 변수로 유연하게 설정할 수 있게 해둡니다.
 *
 * 필요한 환경 변수:
 * - REPLICATE_API_TOKEN: Replicate API 토큰
 * - REPLICATE_MODEL_VERSION: 사용할 모델 version id (필수)
 * - REPLICATE_IMAGE_FIELD: (선택) input에 넣을 이미지 필드명, 기본 "image"
 *
 * 예) 많은 모델이 input.image 또는 input.input_image 등을 사용합니다.
 */

export type ReplicatePredictionStatus =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface ReplicatePrediction {
  id: string;
  status: ReplicatePredictionStatus;
  output?: unknown;
  error?: unknown;
}

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

const getRequiredEnv = (key: string) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} 환경 변수가 필요합니다`);
  return v;
};

const getToken = () => process.env.REPLICATE_API_TOKEN;

export const isReplicateConfigured = () => {
  return Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_MODEL_VERSION);
};

export const createReplicatePrediction = async (imageUrl: string): Promise<ReplicatePrediction> => {
  const token = getRequiredEnv('REPLICATE_API_TOKEN');
  const version = getRequiredEnv('REPLICATE_MODEL_VERSION');
  const imageField = process.env.REPLICATE_IMAGE_FIELD || 'image';

  const input: Record<string, unknown> = {
    [imageField]: imageUrl,
  };

  // 추가 입력(프롬프트 등)이 필요하면 JSON 문자열로 넘길 수 있도록 지원
  // 예: REPLICATE_EXTRA_INPUT='{"seed":123,"texture":"high"}'
  if (process.env.REPLICATE_EXTRA_INPUT) {
    try {
      const extra = JSON.parse(process.env.REPLICATE_EXTRA_INPUT);
      if (extra && typeof extra === 'object') {
        Object.assign(input, extra);
      }
    } catch {
      // 무시 (설정 실수라도 기본 동작은 유지)
    }
  }

  const res = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      version,
      input,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Replicate 요청 실패: ${res.status} ${text}`);
  }

  const json: any = await res.json();
  return {
    id: json.id,
    status: json.status,
    output: json.output,
    error: json.error,
  };
};

export const getReplicatePrediction = async (id: string): Promise<ReplicatePrediction> => {
  const token = getToken();
  if (!token) throw new Error('REPLICATE_API_TOKEN 환경 변수가 필요합니다');

  const res = await fetch(`${REPLICATE_API_BASE}/predictions/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Replicate 상태 조회 실패: ${res.status} ${text}`);
  }

  const json: any = await res.json();
  return {
    id: json.id,
    status: json.status,
    output: json.output,
    error: json.error,
  };
};

/**
 * Replicate output에서 모델 파일 URL을 최대한 추출합니다.
 * - 모델마다 output이 string / array / object 등으로 다릅니다.
 */
export const extractModelUrlFromOutput = (output: unknown): string | null => {
  if (!output) return null;

  // string이면 그대로 URL로 취급
  if (typeof output === 'string') return output;

  // 배열이면 첫 번째 string을 우선 사용
  if (Array.isArray(output)) {
    const firstString = output.find((x) => typeof x === 'string') as string | undefined;
    if (firstString) return firstString;
  }

  // 객체면 흔한 키 후보를 탐색
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    const candidates = ['model', 'glb', 'gltf', 'output', 'url', 'file', 'files'];
    for (const key of candidates) {
      const v = obj[key];
      const nested = extractModelUrlFromOutput(v);
      if (nested) return nested;
    }
  }

  return null;
};


