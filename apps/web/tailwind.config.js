/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors using CSS variables
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',

        // Primary - neutral dark/light
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },

        // Accent
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },

        // Semantic states
        success: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },

        // Legacy chat colors
        charcoal: '#18181b',
        'darker-charcoal': '#09090b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 12px -4px rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 12px -4px rgba(0, 0, 0, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 24px -8px rgba(0, 0, 0, 0.1), 0 16px 48px -16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
