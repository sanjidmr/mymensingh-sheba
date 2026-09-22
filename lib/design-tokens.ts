/**
 * Mymensingh Sheba Design Tokens
 * 
 * Visual Identity:
 * - Clean Green & White identity
 * - Modern, trustworthy, local Mymensingh community focused
 * - Mobile-first touch compliance (>= 44px min touch targets)
 * - Calibrated contrast for Bangla & English readability
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary Green Palette (Trust, Growth, Local Service)
    primary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534', // Deep Brand Primary
      900: '#14532D',
      950: '#052E16',
    },
    // Backgrounds
    background: {
      base: '#FBFDFB',
      surface: '#FFFFFF',
      subtle: '#F4F7F4',
      muted: '#EBF2EC',
    },
    // Neutrals / Typography
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#334155', // Slate 700
      muted: '#64748B', // Slate 500
      subtle: '#94A3B8', // Slate 400
      inverse: '#FFFFFF',
    },
    // Borders
    border: {
      subtle: '#E2E8F0', // Slate 200
      muted: '#CBD5E1', // Slate 300
      brand: '#BBF7D0', // Green 200
      focus: '#15803D', // Green 700
    },
    // Semantic States
    state: {
      success: {
        bg: '#F0FDF4',
        border: '#BBF7D0',
        text: '#166534',
      },
      warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
      },
      error: {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
      },
      info: {
        bg: '#EFF6FF',
        border: '#BFDBFE',
        text: '#1E40AF',
      },
    },
  },
  // Minimum touch target for mobile thumb ergonomics
  touchTarget: '44px',
  // Predictable radius
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    pill: '9999px',
  },
} as const;
