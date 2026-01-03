import { HTMLAttributes, forwardRef } from 'react';

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'pink' | 'ocean';
  animate?: boolean;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
}

export const GradientText = forwardRef<HTMLElement, GradientTextProps>(
  ({ className = '', variant = 'primary', animate = false, as: Component = 'span', children, ...props }, ref) => {
    const variantStyles = {
      primary: 'gradient-text',
      pink: 'gradient-text-pink',
      ocean: 'gradient-text-ocean',
    };

    const animateStyles = animate ? 'bg-200% animate-gradient-x' : '';

    return (
      <Component
        ref={ref as any}
        className={`${variantStyles[variant]} ${animateStyles} font-bold ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

GradientText.displayName = 'GradientText';
