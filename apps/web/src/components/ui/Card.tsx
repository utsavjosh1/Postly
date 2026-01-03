import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'glass', hover = true, children, ...props }, ref) => {
    const baseStyles = 'rounded-lg transition-all duration-300';

    const variantStyles = {
      default: 'bg-white shadow-sm border border-gray-200',
      glass: 'glass-card',
      gradient: 'bg-gradient-primary text-white shadow-glow',
    };

    const hoverStyles = hover
      ? 'hover:shadow-glass-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer'
      : '';

    return (
      <div ref={ref} className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
