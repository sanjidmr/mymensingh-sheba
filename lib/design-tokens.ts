/**
 * Mymensingh Sheba Design Tokens
 *
 * Visual Identity:
 * - Deep Forest Green core, Soft Sage secondary, Warm Earth Bronze & Golden
 *   Yellow spark — a warm, human, local, premium feel for Mymensingh.
 * - Ratio guide ≈ Forest 40% / Sage 25% / Warm Cream 25% / Bronze+Gold 10%
 * - Mobile-first touch compliance (>= 44px min touch targets)
 * - Calibrated contrast for Bangla & English readability
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary — Deep Forest Green (#0C3B2E) → Soft Sage Green (#6D9773)
    // 600 is a darkened sage holding >= 4.5:1 on white for text/links.
    primary: {
      50: '#F1F5F1',
      100: '#E0E9E0',
      200: '#C5D6C6',
      300: '#A5C0A7',
      400: '#84A68B',
      500: '#6D9773', // Soft Sage Green
      600: '#4A7857',
      700: '#0C3B2E', // Deep Forest Green Primary
      800: '#0A3227',
      900: '#07271F',
      950: '#051F18',
    },
    // Warm Golden Yellow — the controlled spark, used sparingly
    accent: {
      100: '#FFF3CC',
      200: '#FFE79A',
      300: '#FFD15C',
      400: '#FFBA00', // Warm Golden Yellow
      500: '#E0A200',
      600: '#B88200',
      700: '#925E00',
    },
    // Warm Earth / Bronze — detail, borders, small highlights
    bronze: {
      50: '#FAF6EF',
      100: '#F3E9DA',
      200: '#E6D3B8',
      300: '#D4B489',
      400: '#C89F6B',
      500: '#BB8A52', // Warm Earth / Bronze
      600: '#9A6E3C',
      700: '#775129',
    },
    // Backgrounds
    background: {
      base: '#FAF8F2',
      surface: '#FFFFFF',
      subtle: '#F1EDE1',
      muted: '#E7E1D1',
    },
    // Neutrals / Typography (green-charcoal ink)
    text: {
      primary: '#16241C',
      secondary: '#2B3A31',
      muted: '#57665C',
      subtle: '#7D8B81',
      inverse: '#FFFFFF',
    },
    // Borders
    border: {
      subtle: '#E0E9E0',
      muted: '#C5D6C6',
      brand: '#C5D6C6',
      bronze: '#E6D3B8',
      focus: '#0C3B2E',
    },
    // Semantic States
    state: {
      success: {
        bg: '#F1F5F1',
        border: '#C5D6C6',
        text: '#0A3227',
      },
      warning: {
        bg: '#FFF3CC',
        border: '#FFD15C',
        text: '#925E00',
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