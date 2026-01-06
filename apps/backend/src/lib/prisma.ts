import { PrismaClient } from '@prisma/client';
import { dirname, resolve } from 'path';
import fs from 'fs';

/**
 * 주의: 이 프로젝트는 ESM(Node)로 실행되지만, Jest는 기본적으로 CJS 환경에서 실행됩니다.
 * 따라서 import.meta.url 같은 ESM 전용 기능에 의존하지 않고, CWD 기반으로 안정적으로 DB 경로를 해석합니다.
 *
 * 목표:
 * - apps/backend에서 단독 실행(pnpm dev)해도 OK
 * - repo 루트에서 turbo run dev로 실행해도 OK
 */

// DATABASE_URL을 절대 경로로 변환 (SQLite의 경우)
const dbUrl = process.env.DATABASE_URL || '';
let finalDbUrl = dbUrl;

if (dbUrl.startsWith('file:')) {
  const relativePath = dbUrl.replace('file:', '');
  // absolute path면 그대로, 상대 경로면 후보 경로를 순서대로 탐색
  const isAbsolute = relativePath.startsWith('/');
  if (isAbsolute) {
    finalDbUrl = `file:${relativePath}`;
  } else {
    const rel = relativePath.replace(/^file:/, '');
    const candidates = [
      resolve(process.cwd(), rel),
      resolve(process.cwd(), 'apps/backend', rel),
    ];

    const pick = candidates.find((p) => {
      // 파일이 없더라도, 상위 디렉토리가 존재하면 Prisma가 생성/접속할 수 있으므로 허용
      const dir = dirname(p);
      return fs.existsSync(p) || fs.existsSync(dir);
    });

    finalDbUrl = `file:${pick || candidates[0]}`;
  }
}

// 개발 환경에서 경로 진단(문제 발생 시 빠르게 원인 파악)
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('[Prisma] DATABASE_URL 해석 결과:', finalDbUrl);
}

// Prisma Client 인스턴스 생성 (절대 경로로 변환된 DATABASE_URL 사용)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: finalDbUrl,
    },
  },
});

// 개발 환경에서 쿼리 로깅 (선택사항)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
  });
}

export default prisma;


