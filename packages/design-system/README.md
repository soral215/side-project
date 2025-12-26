# @side-project/design-system

모노레포 사이드 프로젝트의 디자인 시스템 패키지입니다.

## 설치

이 패키지는 모노레포 내부에서 사용됩니다. 다른 패키지에서 다음과 같이 사용할 수 있습니다:

```bash
pnpm add @side-project/design-system
```

## 사용법

### 컴포넌트 사용

```tsx
import { Button, Input, Card, Modal } from '@side-project/design-system';

function MyComponent() {
  return (
    <Card>
      <Input label="이메일" type="email" />
      <Button variant="primary">제출</Button>
    </Card>
  );
}
```

### 스타일 임포트

```tsx
import '@side-project/design-system/styles';
```

## 컴포넌트

### Button

버튼 컴포넌트입니다.

```tsx
<Button variant="primary" size="md" isLoading={false}>
  클릭
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `fullWidth`: boolean

### Input

입력 필드 컴포넌트입니다.

```tsx
<Input
  label="이메일"
  type="email"
  placeholder="example@email.com"
  error="올바른 이메일 형식이 아닙니다"
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `fullWidth`: boolean

### Card

카드 컴포넌트입니다.

```tsx
<Card variant="default" padding="md">
  <h3>카드 제목</h3>
  <p>카드 내용</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'

### Modal

모달 컴포넌트입니다.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="모달 제목"
  size="md"
>
  <p>모달 내용</p>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean

## 스토리북

컴포넌트를 시각적으로 확인하고 테스트할 수 있습니다:

```bash
pnpm dev
```

브라우저에서 `http://localhost:6006`로 접속하세요.

### 스토리북 설정

이 프로젝트는 [Turborepo Storybook 가이드](https://turborepo.com/docs/guides/tools/storybook)를 참고하여 설정되었습니다.

- **프레임워크**: `@storybook/react-vite` (Vite 기반)
- **포트**: 6006
- **Stories 경로**: `src/**/*.stories.@(js|jsx|mjs|ts|tsx)`

### 트러블슈팅

#### 1. TypeScript 파싱 오류 (Module parse failed: Unexpected token)

**증상:**
```
ERROR in ./src/components/Button/Button.stories.tsx 1:12
Module parse failed: Unexpected token (1:12)
File was processed with these loaders:
 * @storybook/csf-plugin
 * export-order-loader
```

**원인:**
- `@storybook/react-webpack5`를 사용할 때 Webpack 로더 순서 문제로 TypeScript 파일이 제대로 처리되지 않음
- `csf-plugin`과 `export-order-loader`가 TypeScript를 JavaScript로 변환하기 전에 실행됨

**해결 방법:**
- `@storybook/react-vite`로 변경 (Vite는 TypeScript를 기본 지원)
- 또는 Webpack 설정에서 TypeScript 로더를 명시적으로 추가하고 순서 조정

#### 2. 잘못된 프레임워크 사용 오류

**증상:**
```
SB_CORE-COMMON_0002 (InvalidFrameworkNameError): Invalid value of '@storybook/react' in the 'framework' field
```

**원인:**
- Storybook 8.6에서 프레임워크 API가 변경됨
- `@storybook/react`는 더 이상 유효한 프레임워크 이름이 아님

**해결 방법:**
- `@storybook/react-vite` 또는 `@storybook/react-webpack5` 사용
- `npx storybook automigrate` 실행하여 자동 마이그레이션

#### 3. Next.js 프레임워크 오류

**증상:**
```
TypeError: Cannot read properties of undefined (reading 'tap')
```

**원인:**
- `@storybook/nextjs` 프레임워크를 사용했지만 Next.js 프로젝트가 아님
- Next.js 설정 파일이 없어서 Webpack 설정 오류 발생

**해결 방법:**
- 디자인 시스템 패키지는 Next.js 프로젝트가 아니므로 `@storybook/react-vite` 사용

#### 4. 모노레포 환경에서의 의존성 해결 문제

**증상:**
- Storybook이 루트 `node_modules`의 의존성을 찾지 못함
- pnpm workspace 환경에서 의존성 해결 실패

**해결 방법:**
- Vite 기반 프레임워크 사용 (Vite는 모노레포 환경을 잘 지원)
- 또는 Webpack 설정에서 `resolve.modules`에 루트 `node_modules` 경로 추가

### 참고 자료

- [Turborepo Storybook 가이드](https://turborepo.com/docs/guides/tools/storybook)
- [Storybook 공식 문서](https://storybook.js.org/)

## 테마

Tailwind CSS를 사용하여 디자인 시스템이 구성되어 있습니다. 색상, 타이포그래피, 간격 등은 `tailwind.config.ts`에서 관리됩니다.

### 색상

- Primary: 파란색 계열
- Gray: 회색 계열
- Success: 초록색 계열
- Error: 빨간색 계열
- Warning: 노란색 계열

## 개발

### 타입 체크

```bash
pnpm type-check
```

### 린트

```bash
pnpm lint
```

### 스토리북 빌드

```bash
pnpm build
```

빌드 결과물은 `storybook-static` 디렉토리에 생성됩니다.


