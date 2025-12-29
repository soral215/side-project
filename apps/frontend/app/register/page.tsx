'use client';

import { useState } from 'react';
import { useRegister } from '../../src/hooks/useAuth';
import { registerSchema, ZodError } from '@side-project/shared';
import { useToast } from '../../src/contexts/ToastContext';
import { Button, Input, Card } from '@side-project/design-system';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const registerMutation = useRegister();
  const { showError, showSuccess } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = registerSchema.parse({ name, email, password });
      await registerMutation.mutateAsync(validatedData);
      showSuccess('회원가입에 성공했습니다! 환영합니다.');
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        showError(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">회원가입</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="text"
            label="이름"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            error={errors.name}
            fullWidth
          />
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
            isLoading={registerMutation.isPending}
            fullWidth
          >
            {registerMutation.isPending ? '가입 중...' : '회원가입'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              로그인
            </a>
          </p>
        </div>
      </Card>
    </main>
  );
}
