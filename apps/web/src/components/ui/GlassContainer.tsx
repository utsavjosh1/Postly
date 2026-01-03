import { HTMLAttributes, forwardRef } from 'react';

export interface GlassContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ className = '', variant = 'light', padding = 'md', rounded = 'lg', children, ...props }, ref) => {
    const variantStyles = {
      light: 'glass',
      dark: 'glass-dark',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const roundedStyles = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${paddingStyles[padding]} ${roundedStyles[rounded]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassContainer.displayName = 'GlassContainer';
