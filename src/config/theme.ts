/**
 * Single Source of Truth for Brand & Theme Color Tokens
 * Calibrated to match the Tan-Sang mascot logo (Warm Palm & Roasted Cocoa)
 */
export const THEME_COLORS = {
  canvas: '#FAF6F0',
  surface: '#FFFFFF',
  subtle: '#F3ECE2',
  border: '#E9DFD3',
  ink: {
    primary: '#362520',
    secondary: '#6E5850',
    muted: '#948078',
  },
  accent: {
    DEFAULT: '#D4621A',
    hover: '#BC5313',
    subtle: '#FCEFE7',
  },
  success: {
    DEFAULT: '#059669',
    hover: '#047857',
    subtle: '#ECFDF5',
    accent: '#059669',
  },
  warning: '#B45309',
  error: '#DC2626',
} as const;

export type ThemeColors = typeof THEME_COLORS;
