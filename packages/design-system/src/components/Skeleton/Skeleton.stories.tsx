import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';
import { SkeletonCard } from './SkeletonCard';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    circle: {
      control: 'boolean',
    },
    animate: {
      control: 'boolean',
    },
    variant: {
      control: 'select',
      options: ['text', 'rectangular', 'circular'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    width: '100%',
    height: 20,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 64,
    height: 64,
  },
};

export const WithoutAnimation: Story = {
  args: {
    width: 200,
    height: 20,
    animate: false,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Skeleton width={200} height={16} />
      <Skeleton width={200} height={20} />
      <Skeleton width={200} height={24} />
      <Skeleton width={200} height={32} />
    </div>
  ),
};

export const TextSkeleton: Story = {
  render: () => <SkeletonText lines={3} />,
};

export const TextSkeletonCustom: Story = {
  render: () => <SkeletonText lines={4} lastLineWidth="40%" />,
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      <SkeletonCard showAvatar={true} showTitle={true} showText={true} showButton={true} />
      <SkeletonCard showAvatar={false} showTitle={true} showText={true} showButton={false} />
    </div>
  ),
};

export const UserListSkeleton: Story = {
  render: () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard
          key={index}
          showAvatar={false}
          showTitle={true}
          showText={true}
          showButton={true}
        />
      ))}
    </div>
  ),
};

export const ProfileSkeleton: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col items-center">
        <Skeleton variant="circular" width={120} height={120} />
        <Skeleton width={150} height={20} className="mt-4" />
      </div>
      <div className="space-y-4">
        <div>
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton width="100%" height={40} />
        </div>
        <div>
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton width="100%" height={40} />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton width={120} height={40} />
        <Skeleton width={120} height={40} />
      </div>
    </div>
  ),
};

