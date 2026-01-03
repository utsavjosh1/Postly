import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-all duration-200';

    const variantStyles = {
      default: 'bg-card border border-border shadow-soft',
      elevated: 'bg-card border border-border shadow-soft-md hover:shadow-soft-lg',
      outline: 'bg-transparent border border-border',
    };

    return (
      <div ref={ref} className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
