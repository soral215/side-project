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
pnpm storybook
```

브라우저에서 `http://localhost:6006`로 접속하세요.

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
pnpm build-storybook
```

