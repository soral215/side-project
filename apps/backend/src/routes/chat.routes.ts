import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createErrorResponse } from '@side-project/shared';
import { openai } from '../lib/openai.js';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router: IRouter = Router();

/**
 * POST /api/chat
 * AI 챗봇 엔드포인트 - 스트리밍 응답 지원
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json(createErrorResponse('메시지가 필요합니다', 'INVALID_MESSAGE'));
    }

    if (!process.env.OPENAI_API_KEY || !openai) {
      return res.status(503).json(createErrorResponse('OpenAI API 키가 설정되지 않았습니다', 'OPENAI_NOT_CONFIGURED'));
    }

    // 사용자 데이터 조회 (컨텍스트 제공)
    const totalUsers = await prisma.user.count();
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 시스템 프롬프트
    const systemPrompt = `당신은 사용자 관리 시스템의 AI 어시스턴트입니다.
다음 정보를 참고하여 사용자의 질문에 답변하세요:

- 총 사용자 수: ${totalUsers}명
- 최근 가입한 사용자 (최대 5명):
${recentUsers.map((u, i) => `${i + 1}. ${u.name} (${u.email}) - ${new Date(u.createdAt).toLocaleDateString('ko-KR')}`).join('\n')}

## 당신이 할 수 있는 것 (읽기 전용):
- 사용자 통계 및 정보 제공 (총 사용자 수, 최근 가입자 등)
- 데이터 분석 및 인사이트 제공
- 시스템 사용 방법 안내
- 사용자 검색 방법 안내

## 당신이 할 수 없는 것 (중요!):
- 사용자 추가/생성 (회원가입은 /register 페이지에서 직접 해야 함)
- 사용자 정보 수정/삭제 (프로필 페이지나 사용자 목록에서 직접 해야 함)
- 데이터베이스에 직접 변경을 가하는 모든 작업

## 중요한 규칙:
1. 사용자가 사용자 추가, 수정, 삭제를 요청하면:
   - "죄송하지만 저는 사용자 정보를 조회하고 안내만 할 수 있습니다."
   - "사용자 추가는 회원가입 페이지(/register)에서 직접 해주세요."
   - "사용자 수정/삭제는 프로필 페이지나 사용자 목록에서 직접 해주세요."
   - 이렇게 명확히 답변하세요.

2. 할 수 없는 작업에 대해 "할 수 있다"고 거짓말하지 마세요.
3. 항상 정직하고 정확하게 답변하세요.
4. 할 수 없는 작업을 요청받으면, 대신 어떻게 할 수 있는지 안내해주세요.

## 답변 예시:

사용자: "새 사용자를 추가해줘"
당신: "죄송하지만 저는 사용자 정보를 조회하고 안내만 할 수 있습니다. 새 사용자를 추가하려면 회원가입 페이지(/register)에서 직접 가입해주세요."

사용자: "홍길동의 이메일을 수정해줘"
당신: "죄송하지만 저는 사용자 정보를 수정할 수 없습니다. 사용자 정보를 수정하려면 프로필 페이지나 사용자 목록에서 직접 수정해주세요."

사용자: "총 사용자 수는?"
당신: "현재 총 ${totalUsers}명의 사용자가 등록되어 있습니다."

항상 한국어로 친절하고 정확하게 답변하세요. 데이터를 요청받으면 실제 데이터를 조회하여 제공하세요.`;

    // 대화 히스토리 구성
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // 최근 10개 메시지만 유지
      { role: 'user', content: message },
    ];

    // 스트리밍 응답 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // OpenAI 스트리밍 요청
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // 스트리밍 응답 전송
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // 스트리밍 종료
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('챗봇 에러:', error);
    if (!res.headersSent) {
      res.status(500).json(createErrorResponse('챗봇 응답 생성에 실패했습니다', 'CHAT_ERROR'));
    } else {
      res.end();
    }
  }
});

export { router as chatRoutes };

