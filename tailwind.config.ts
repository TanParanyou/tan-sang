import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        theme: '12px',
      },
      boxShadow: {
        theme: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      },
      colors: {
        canvas: 'var(--bg-canvas, #F8FAFC)',
        surface: 'var(--bg-surface, #FFFFFF)',
        subtle: 'var(--bg-subtle, #F1F5F9)',
        ink: {
          DEFAULT: 'var(--text-primary, #0F172A)',
          secondary: 'var(--text-secondary, #475569)',
          muted: 'var(--text-muted, #64748B)',
        },
        hairline: 'var(--border-subtle, #E2E8F0)',
        primary: {
          DEFAULT: 'var(--color-primary, #0A0A0A)',
          foreground: 'var(--color-primary-fg, #FAFAFA)',
        },
        chili: {
          DEFAULT: 'var(--color-accent, #0A0A0A)',
          hover: '#18181B',
          subtle: '#F4F4F5',
        },
        line: {
          DEFAULT: 'var(--color-success, #16A34A)',
          hover: '#15803D',
          subtle: '#F0FDF4',
        },
      },
    },
  },
  plugins: [],
};

export default config;
