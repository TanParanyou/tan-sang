import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        theme: 'var(--radius-theme, 12px)',
      },
      boxShadow: {
        theme: 'var(--shadow-theme, 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06))',
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        hairline: 'var(--border-subtle)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-fg)',
        },
        chili: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
        },
        line: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
          subtle: 'var(--color-success-subtle)',
          accent: 'var(--color-success-accent)',
        },
        'line-accent': 'var(--color-success-accent)',
      },
      keyframes: {
        'mascot-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'mascot-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        'mascot-bounce': {
          '0%': { transform: 'scale(0.3) translateY(36px)', opacity: '0' },
          '40%': { transform: 'scale(1.15) translateY(-10px)', opacity: '1' },
          '65%': { transform: 'scale(0.94) translateY(3px)' },
          '82%': { transform: 'scale(1.04) translateY(-2px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        'mascot-wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-5deg)' },
          '40%': { transform: 'rotate(5deg)' },
          '60%': { transform: 'rotate(-2.5deg)' },
          '80%': { transform: 'rotate(2.5deg)' },
        },
        'mascot-shadow': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '40%': { transform: 'scale(0.85)', opacity: '0.35' },
          '65%': { transform: 'scale(1.1)', opacity: '0.8' },
          '82%': { transform: 'scale(0.95)', opacity: '0.6' },
          '100%': { transform: 'scale(1)', opacity: '0.7' },
        },
        'particle-float-1': {
          '0%': { transform: 'translateY(8px) scale(0.6) rotate(-8deg)', opacity: '0' },
          '30%': { opacity: '1', transform: 'translateY(-6px) scale(1) rotate(4deg)' },
          '80%': { opacity: '0.75' },
          '100%': { transform: 'translateY(-24px) scale(0.8) rotate(12deg)', opacity: '0' },
        },
        'particle-float-2': {
          '0%': { transform: 'translateY(10px) scale(0.5) rotate(10deg)', opacity: '0' },
          '35%': { opacity: '1', transform: 'translateY(-8px) scale(1.05) rotate(-6deg)' },
          '80%': { opacity: '0.75' },
          '100%': { transform: 'translateY(-28px) scale(0.7) rotate(-18deg)', opacity: '0' },
        },
        'splash-progress': {
          '0%': { width: '0%' },
          '40%': { width: '55%' },
          '80%': { width: '85%' },
          '100%': { width: '100%' },
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.04)' },
        },
        'paper-slide': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(0.98)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'mascot-float': 'mascot-float 3.5s ease-in-out infinite',
        'mascot-breathe': 'mascot-breathe 3s ease-in-out infinite',
        'mascot-bounce': 'mascot-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'mascot-wiggle': 'mascot-wiggle 2s ease-in-out infinite',
        'mascot-shadow': 'mascot-shadow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'particle-float-1': 'particle-float-1 2.2s ease-in-out infinite',
        'particle-float-2': 'particle-float-2 2.6s ease-in-out infinite',
        'splash-progress': 'splash-progress 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-out': 'fade-out 0.4s ease-out forwards',
        'paper-slide': 'paper-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'soft-pulse': 'soft-pulse 2.5s ease-in-out infinite',
        'pop-in': 'pop-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in': 'fade-in 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
