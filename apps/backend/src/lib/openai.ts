import OpenAI from 'openai';

/**
 * OpenAI 클라이언트 인스턴스
 * API 키가 없을 때는 null을 반환하여 에러를 방지합니다.
 */
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * 자연어 검색 쿼리를 Prisma 쿼리 조건으로 변환합니다.
 * 
 * @param query - 사용자가 입력한 자연어 검색 쿼리
 * @returns Prisma where 조건 객체
 */
export async function parseSearchQuery(query: string): Promise<any> {
  if (!process.env.OPENAI_API_KEY || !openai) {
    // API 키가 없으면 기본 검색으로 폴백
    return {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
      ],
    } as any;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 사용자 검색 쿼리를 분석하여 데이터베이스 쿼리 조건으로 변환하는 AI 어시스턴트입니다.
사용자의 자연어 질문을 분석하여 다음 형식의 JSON을 반환하세요:

{
  "name": "검색할 이름 (부분 일치)",
  "email": "검색할 이메일 또는 도메인",
  "dateRange": "last7days" | "last30days" | "today" | null
}

예시:
- "이번 주에 가입한 사용자" → {"dateRange": "last7days"}
- "gmail 사용자" → {"email": "gmail.com"}
- "홍길동" → {"name": "홍길동"}
- "이번 달에 가입한 gmail 사용자" → {"email": "gmail.com", "dateRange": "last30days"}

항상 유효한 JSON만 반환하세요.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI 응답이 비어있습니다');
    }

    const parsed = JSON.parse(content);
    const where: any = {};

    // 이름 검색
    if (parsed.name) {
      where.name = { contains: parsed.name };
    }

    // 이메일 검색
    if (parsed.email) {
      // 도메인만 있는 경우 (예: "gmail.com")
      if (parsed.email.includes('@')) {
        where.email = { contains: parsed.email };
      } else {
        // 도메인만 있는 경우 "@gmail.com"으로 검색
        where.email = { contains: `@${parsed.email}` };
      }
    }

    // 날짜 범위
    if (parsed.dateRange) {
      const now = new Date();
      let startDate: Date;

      switch (parsed.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      where.createdAt = { gte: startDate };
    }

    // 이름이나 이메일이 없으면 기본 검색으로 폴백
    if (!where.name && !where.email && !where.createdAt) {
      return {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      } as any;
    }

    return where;
  } catch (error) {
    console.error('OpenAI 쿼리 파싱 실패:', error);
    // 에러 발생 시 기본 검색으로 폴백
    return {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
      ],
    } as any;
  }
}

