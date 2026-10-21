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
        theme: 'var(--radius-theme, 0px)',
      },
      boxShadow: {
        theme: 'var(--shadow-theme, none)',
      },
      colors: {
        canvas: 'var(--bg-canvas, #FAFAFA)',
        surface: 'var(--bg-surface, #FFFFFF)',
        subtle: 'var(--bg-subtle, #F4F4F5)',
        ink: {
          DEFAULT: 'var(--text-primary, #0A0A0A)',
          secondary: 'var(--text-secondary, #71717A)',
          muted: 'var(--text-muted, #A1A1AA)',
        },
        hairline: 'var(--border-subtle, #D4D4D8)',
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
