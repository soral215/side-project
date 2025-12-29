import React from 'react';
import { clsx } from 'clsx';

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

const sizeStyles = {
  sm: {
    container: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translateX(1.25rem)',
    translateOff: 'translateX(0.125rem)',
    text: 'text-[10px]',
  },
  md: {
    container: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translateX(1.75rem)',
    translateOff: 'translateX(0.125rem)',
    text: 'text-xs',
  },
  lg: {
    container: 'h-8 w-16',
    thumb: 'h-7 w-7',
    translate: 'translateX(2rem)',
    translateOff: 'translateX(0.125rem)',
    text: 'text-sm',
  },
};

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      onChange,
      size = 'md',
      showLabel = true,
      disabled = false,
      className,
      'aria-label': ariaLabel,
      onClick,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizeStyles[size];

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onChange?.(!checked);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleClick}
        className={clsx(
          'relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked
            ? 'bg-blue-500 dark:bg-blue-600 shadow-inner'
            : 'bg-gray-300 dark:bg-gray-700',
          sizeConfig.container,
          className
        )}
        style={{
          minWidth: size === 'sm' ? '2.75rem' : size === 'md' ? '3.5rem' : '4rem',
          minHeight: size === 'sm' ? '1.5rem' : size === 'md' ? '1.75rem' : '2rem',
        }}
        {...props}
      >
        <span
          className={clsx(
            'inline-block rounded-full transition-all duration-300 ease-in-out',
            'border-2',
            checked
              ? 'bg-white dark:bg-gray-100 border-blue-500 dark:border-blue-600 shadow-lg shadow-blue-500/30'
              : 'bg-white dark:bg-gray-300 border-gray-300 dark:border-gray-600 shadow-md',
            sizeConfig.thumb
          )}
          style={{
            transform: checked ? sizeConfig.translate : sizeConfig.translateOff,
          }}
        />
        {/* {showLabel && (
          <span
            className={clsx(
              'absolute font-bold transition-opacity duration-200',
              sizeConfig.text,
              checked
                ? 'text-white left-1.5 opacity-100'
                : 'text-white dark:text-gray-200 right-1.5 opacity-100'
            )}
          >
            {checked ? 'ON' : 'OFF'}
          </span>
        )} */}
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';

