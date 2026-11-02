/**
 * VESSEL DESIGN TOKENS
 * Single source of truth for the calm, editorial design system.
 */

export const tokens = {
  colors: {
    // Warm Neutrals (High Contrast)
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',

    // Action Tokens
    primaryBg: '#0F172A',
    primaryText: '#FFFFFF',
    primaryHoverBg: '#1E293B',
    
    secondaryBg: 'transparent',
    secondaryBorder: '#E2E8F0',
    secondaryText: '#0F172A',
    secondaryHoverBg: '#F1F5F9',

    // Photo Placeholder
    placeholderBg: '#F1F5F9',
    placeholderText: '#64748B',

    // Modern High-Contrast Pillar Colors
    pillars: {
      STR: '#E11D48', // Strength: crisp crimson
      INT: '#2563EB', // Intellect: electric blue
      WIS: '#D97706', // Wisdom: golden amber
      CHA: '#059669', // Charisma: vibrant emerald
    },

    // Semantic Colors
    danger: '#E11D48',
    overdue: '#E11D48',
    success: '#059669',
  },

  typography: {
    fontSerif: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif",
    fontSans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif",

    scale: {
      pageTitle: '32px',
      sectionHeading: '20px',
      body: '15px',
      small: '13px',
      tiny: '11px',
    },
  },

  radius: {
    sm: '4px',
    base: '6px', // Standard 6px radius rule across entire app
  },
} as const;

export type PillarCode = keyof typeof tokens.colors.pillars;
