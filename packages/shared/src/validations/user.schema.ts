import { z } from 'zod';

// 사용자 생성 검증 스키마
export const createUserSchema = z.object({
  name: z
    .string({
      required_error: '이름을 입력해주세요',
      invalid_type_error: '이름은 문자열이어야 합니다',
    })
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(50, '이름은 50자 이하여야 합니다')
    .trim(),
  email: z
    .string({
      required_error: '이메일을 입력해주세요',
      invalid_type_error: '이메일은 문자열이어야 합니다',
    })
    .email('올바른 이메일 형식이 아닙니다')
    .toLowerCase()
    .trim(),
});

// 사용자 업데이트 검증 스키마
export const updateUserSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: '이름은 문자열이어야 합니다',
      })
      .min(2, '이름은 2자 이상이어야 합니다')
      .max(50, '이름은 50자 이하여야 합니다')
      .trim()
      .optional(),
    email: z
      .string({
        invalid_type_error: '이메일은 문자열이어야 합니다',
      })
      .email('올바른 이메일 형식이 아닙니다')
      .toLowerCase()
      .trim()
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.email !== undefined,
    {
      message: 'name 또는 email 중 하나는 필수입니다',
    }
  );

// 타입 추론 (TypeScript 타입 자동 생성)
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

