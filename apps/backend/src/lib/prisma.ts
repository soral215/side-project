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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.ts:12',message:'DATABASE_URL 절대 경로로 변환',data:{originalUrl:dbUrl,resolvedPath:resolvedDbPath,finalUrl:finalDbUrl,dbExists:existsSync(resolvedDbPath)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
} else {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.ts:18',message:'DATABASE_URL (PostgreSQL 등) 그대로 사용',data:{databaseUrl:dbUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
}

// Prisma Client 인스턴스 생성 (절대 경로로 변환된 DATABASE_URL 사용)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: finalDbUrl,
    },
  },
});

// #region agent log
fetch('http://127.0.0.1:7242/ingest/1b3b423a-82ed-4e82-abfd-69a32e3af630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.ts:20',message:'PrismaClient 생성 완료',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// 개발 환경에서 쿼리 로깅 (선택사항)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
  });
}

export default prisma;


