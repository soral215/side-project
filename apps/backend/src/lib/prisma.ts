import { PrismaClient } from '@prisma/client';

// Prisma Client 인스턴스 생성
const prisma = new PrismaClient();

// 개발 환경에서 쿼리 로깅 (선택사항)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
  });
}

export default prisma;


