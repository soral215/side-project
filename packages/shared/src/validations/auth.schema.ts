import { z } from 'zod';

// 회원가입 검증 스키마
export const registerSchema = z.object({
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
  password: z
    .string({
      required_error: '비밀번호를 입력해주세요',
      invalid_type_error: '비밀번호는 문자열이어야 합니다',
    })
    .min(6, '비밀번호는 6자 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다'),
});

// 로그인 검증 스키마
export const loginSchema = z.object({
  email: z
    .string({
      required_error: '이메일을 입력해주세요',
      invalid_type_error: '이메일은 문자열이어야 합니다',
    })
    .email('올바른 이메일 형식이 아닙니다')
    .toLowerCase()
    .trim(),
  password: z
    .string({
      required_error: '비밀번호를 입력해주세요',
      invalid_type_error: '비밀번호는 문자열이어야 합니다',
    })
    .min(1, '비밀번호를 입력해주세요'),
});

// 프로필 수정 검증 스키마
export const updateProfileSchema = z.object({
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
}).refine(
  (data) => data.name !== undefined || data.email !== undefined,
  {
    message: 'name 또는 email 중 하나는 필수입니다',
  }
);

// 비밀번호 변경 검증 스키마
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({
      required_error: '현재 비밀번호를 입력해주세요',
      invalid_type_error: '비밀번호는 문자열이어야 합니다',
    })
    .min(1, '현재 비밀번호를 입력해주세요'),
  newPassword: z
    .string({
      required_error: '새 비밀번호를 입력해주세요',
      invalid_type_error: '비밀번호는 문자열이어야 합니다',
    })
    .min(6, '새 비밀번호는 6자 이상이어야 합니다')
    .max(100, '새 비밀번호는 100자 이하여야 합니다'),
  confirmPassword: z
    .string({
      required_error: '비밀번호 확인을 입력해주세요',
      invalid_type_error: '비밀번호 확인은 문자열이어야 합니다',
    })
    .min(1, '비밀번호 확인을 입력해주세요'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: '새 비밀번호와 비밀번호 확인이 일치하지 않습니다',
    path: ['confirmPassword'],
  }
);

// 타입 추론
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

