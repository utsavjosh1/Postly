import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface HamburgerMenuProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
}

export const HamburgerMenu = forwardRef<HTMLButtonElement, HamburgerMenuProps>(
  ({ isOpen, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`relative w-10 h-10 flex items-center justify-center transition-all duration-200 hover:bg-gray-100 rounded-lg ${className}`}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        {...props}
      >
        <div className="w-6 h-5 relative flex flex-col justify-between">
          <span
            className={`w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </div>
      </button>
    );
  }
);

HamburgerMenu.displayName = 'HamburgerMenu';
