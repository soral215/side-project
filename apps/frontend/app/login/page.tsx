'use client';

import { useState } from 'react';
import { useLogin } from '../../src/hooks/useAuth';
import { loginSchema, ZodError } from '@side-project/shared';
import { useToast } from '../../src/contexts/ToastContext';
import { Button, Input } from '@side-project/design-system';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const loginMutation = useLogin();
  const { showError } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = loginSchema.parse({ email, password });
      await loginMutation.mutateAsync(validatedData);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        showError(error instanceof Error ? error.message : '로그인에 실패했습니다.');
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">로그인</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label="이메일"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
            fullWidth
          />
          <Input
            type="password"
            label="비밀번호"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            fullWidth
          />
          <Button
            type="submit"
            isLoading={loginMutation.isPending}
            fullWidth
          >
            {loginMutation.isPending ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              회원가입
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
