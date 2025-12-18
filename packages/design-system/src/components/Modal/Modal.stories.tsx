import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    showCloseButton: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalWrapper = ({ children, ...props }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} {...props}>
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper title="Modal Title">
      <p className="text-gray-600">
        This is a default modal with a title and close button.
      </p>
    </ModalWrapper>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <ModalWrapper>
      <p className="text-gray-600">
        This modal doesn't have a title.
      </p>
    </ModalWrapper>
  ),
};

export const Small: Story = {
  render: () => (
    <ModalWrapper size="sm" title="Small Modal">
      <p className="text-gray-600">This is a small modal.</p>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalWrapper size="lg" title="Large Modal">
      <p className="text-gray-600">This is a large modal.</p>
    </ModalWrapper>
  ),
};

export const ExtraLarge: Story = {
  render: () => (
    <ModalWrapper size="xl" title="Extra Large Modal">
      <p className="text-gray-600">This is an extra large modal.</p>
    </ModalWrapper>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <ModalWrapper title="No Close Button" showCloseButton={false}>
      <p className="text-gray-600">
        This modal doesn't have a close button in the header.
      </p>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => {}}>Close</Button>
      </div>
    </ModalWrapper>
  ),
};

export const WithContent: Story = {
  render: () => (
    <ModalWrapper title="Modal with Content">
      <div className="space-y-4">
        <p className="text-gray-600">
          This modal contains various content elements.
        </p>
        <div className="space-y-2">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter text..."
          />
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter description..."
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Save</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

