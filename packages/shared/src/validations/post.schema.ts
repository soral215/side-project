import { z } from 'zod';

// 게시글 생성 검증 스키마
export const createPostSchema = z.object({
  title: z
    .string({
      required_error: '제목을 입력해주세요',
      invalid_type_error: '제목은 문자열이어야 합니다',
    })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이하여야 합니다')
    .trim(),
  content: z
    .string({
      required_error: '내용을 입력해주세요',
      invalid_type_error: '내용은 문자열이어야 합니다',
    })
    .min(1, '내용을 입력해주세요')
    .trim(),
  authorId: z.string().uuid('올바른 사용자 ID 형식이 아닙니다'),
});

// 게시글 업데이트 검증 스키마
export const updatePostSchema = z.object({
  title: z
    .string({
      invalid_type_error: '제목은 문자열이어야 합니다',
    })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이하여야 합니다')
    .trim()
    .optional(),
  content: z
    .string({
      invalid_type_error: '내용은 문자열이어야 합니다',
    })
    .min(1, '내용을 입력해주세요')
    .trim()
    .optional(),
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  {
    message: 'title 또는 content 중 하나는 필수입니다',
  }
);

// 댓글 생성 검증 스키마
export const createCommentSchema = z.object({
  content: z
    .string({
      required_error: '댓글 내용을 입력해주세요',
      invalid_type_error: '댓글 내용은 문자열이어야 합니다',
    })
    .min(1, '댓글 내용을 입력해주세요')
    .trim(),
  postId: z.string().uuid('올바른 게시글 ID 형식이 아닙니다'),
});

// 타입 추론
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

