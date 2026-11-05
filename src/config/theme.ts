/**
 * Single Source of Truth for Brand & Theme Color Tokens
 * Calibrated to match the Tan-Sang mascot logo (Warm Palm & Roasted Cocoa)
 * Supports both Light Mode and Warm Cocoa Dark Mode
 */
export const LIGHT_THEME = {
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

export const DARK_THEME = {
  canvas: '#181311',
  surface: '#231B18',
  subtle: '#2E231F',
  border: '#3E312B',
  ink: {
    primary: '#F6ECE2',
    secondary: '#C6B5A8',
    muted: '#988578',
  },
  accent: {
    DEFAULT: '#E5732F',
    hover: '#F08544',
    subtle: '#382218',
  },
  success: {
    DEFAULT: '#10B981',
    hover: '#059669',
    subtle: '#142E25',
    accent: '#10B981',
  },
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const THEME_COLORS = LIGHT_THEME;

export type ThemeColors = typeof LIGHT_THEME;
