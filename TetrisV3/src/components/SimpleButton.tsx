import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  children: React.ReactNode;
}

export const SimpleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', style, children, disabled, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      whiteSpace: 'nowrap',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      padding: '0.5rem 1rem',
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? '0.5' : '1',
      border: variant === 'outline' ? '1px solid' : 'none',
      ...style
    };

    return (
      <button
        ref={ref}
        className={className}
        style={baseStyle}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SimpleButton.displayName = 'SimpleButton';
