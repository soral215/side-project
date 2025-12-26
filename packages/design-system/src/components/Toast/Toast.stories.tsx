import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';
import { useState } from 'react';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
    duration: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    id: 'toast-1',
    message: '작업이 성공적으로 완료되었습니다.',
    type: 'success',
    duration: 5000,
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    id: 'toast-2',
    message: '오류가 발생했습니다. 다시 시도해주세요.',
    type: 'error',
    duration: 5000,
    onClose: () => {},
  },
};

export const Warning: Story = {
  args: {
    id: 'toast-3',
    message: '주의: 이 작업은 되돌릴 수 없습니다.',
    type: 'warning',
    duration: 5000,
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    id: 'toast-4',
    message: '새로운 업데이트가 있습니다.',
    type: 'info',
    duration: 5000,
    onClose: () => {},
  },
};

export const AllTypes: Story = {
  render: () => {
    const [toasts, setToasts] = useState([
      { id: '1', message: '성공 메시지', type: 'success' as const },
      { id: '2', message: '에러 메시지', type: 'error' as const },
      { id: '3', message: '경고 메시지', type: 'warning' as const },
      { id: '4', message: '정보 메시지', type: 'info' as const },
    ]);

    const handleClose = (id: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
      <div className="space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={handleClose}
          />
        ))}
      </div>
    );
  },
};

export const LongMessage: Story = {
  args: {
    id: 'toast-5',
    message: '이것은 매우 긴 메시지입니다. Toast 컴포넌트가 긴 텍스트를 어떻게 처리하는지 확인할 수 있습니다. 메시지가 길어도 레이아웃이 깨지지 않습니다.',
    type: 'info',
    duration: 5000,
    onClose: () => {},
  },
};

export const NoAutoClose: Story = {
  args: {
    id: 'toast-6',
    message: '이 Toast는 자동으로 닫히지 않습니다. (duration: 0)',
    type: 'warning',
    duration: 0,
    onClose: () => {},
  },
};

