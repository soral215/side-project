/**
 * 개발/데모용 glTF(텍스트) 생성기
 * - 외부 3D 생성 서비스가 없을 때도 프론트에서 3D 뷰어 동작을 확인할 수 있도록
 * - 매우 단순한 삼각형 메시를 반환합니다.
 */

type Vec3 = [number, number, number];

const float32ByteLength = (count: number) => count * 4;
const uint16ByteLength = (count: number) => count * 2;

const toBase64 = (buf: Buffer) => buf.toString('base64');

const calcMinMax = (positions: Float32Array): { min: Vec3; max: Vec3 } => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
};

/**
 * 매우 단순한 "삼각형 1개" glTF(JSON)를 생성합니다.
 * - KHR_materials_unlit을 사용해서 노멀/라이팅 없이도 잘 보이도록 합니다.
 */
export const createMockTriangleGltfJson = (): string => {
  // 화면에서 보기 좋게 약간 큰 삼각형(원점 근처)
  const positions = new Float32Array([
    -0.6, -0.5, 0.0,
     0.6, -0.5, 0.0,
     0.0,  0.7, 0.0,
  ]);
  const indices = new Uint16Array([0, 1, 2]);

  const posBuf = Buffer.from(positions.buffer);
  const idxBuf = Buffer.from(indices.buffer);

  // 버퍼뷰 오프셋(positions는 36바이트로 4바이트 정렬)
  const posOffset = 0;
  const posLength = float32ByteLength(positions.length); // 9 floats
  const idxOffset = posOffset + posLength;
  const idxLength = uint16ByteLength(indices.length); // 3 ushorts

  const combined = Buffer.concat([posBuf, idxBuf]);
  const { min, max } = calcMinMax(positions);

  const gltf = {
    asset: { version: '2.0', generator: 'side-project-mock-gltf' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'MockTriangle' }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0 },
            indices: 1,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'UnlitBlue',
        pbrMetallicRoughness: {
          baseColorFactor: [0.2, 0.6, 1.0, 1.0],
          metallicFactor: 0.0,
          roughnessFactor: 1.0,
        },
        extensions: {
          KHR_materials_unlit: {},
        },
      },
    ],
    buffers: [
      {
        uri: `data:application/octet-stream;base64,${toBase64(combined)}`,
        byteLength: combined.length,
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: posOffset,
        byteLength: posLength,
        target: 34962, // ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: idxOffset,
        byteLength: idxLength,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: 3,
        type: 'VEC3',
        min,
        max,
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: 3,
        type: 'SCALAR',
      },
    ],
    extensionsUsed: ['KHR_materials_unlit'],
  };

  return JSON.stringify(gltf, null, 2);
};


