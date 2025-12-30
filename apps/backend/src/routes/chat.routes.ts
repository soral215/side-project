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

사용자가 다음을 요청할 수 있습니다:
- 사용자 통계 및 정보
- 데이터 분석 요청
- 시스템 사용 방법 안내

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

