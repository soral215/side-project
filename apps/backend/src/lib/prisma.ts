import { PrismaClient } from '@prisma/client';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DATABASE_URL을 절대 경로로 변환 (SQLite의 경우)
const dbUrl = process.env.DATABASE_URL || '';
const cwd = process.cwd();
let finalDbUrl = dbUrl;

if (dbUrl.startsWith('file:')) {
  const relativePath = dbUrl.replace('file:', '');
  const resolvedDbPath = resolve(cwd, relativePath);
  finalDbUrl = `file:${resolvedDbPath}`;
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


