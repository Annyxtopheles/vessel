/**
 * VESSEL DESIGN TOKENS
 * Single source of truth for the calm, editorial design system.
 */

export const tokens = {
  colors: {
    // Warm Neutrals (High Contrast)
    background: '#F6F2EA',
    surface: '#FBF9F4',
    border: '#E4DED2',
    text: '#1F1B16',
    textMuted: '#6B645A',

    // Action Tokens
    primaryBg: '#1F1B16',
    primaryText: '#FBF9F4',
    primaryHoverBg: '#342F29',
    
    secondaryBg: 'transparent',
    secondaryBorder: '#E4DED2',
    secondaryText: '#1F1B16',
    secondaryHoverBg: '#EFEAE0',

    // Photo Placeholder
    placeholderBg: '#EFEAE0',
    placeholderText: '#6B645A',

    // Pillar Colors (Muted Editorial)
    pillars: {
      STR: '#9C3D2A', // Strength: muted terracotta
      INT: '#2D4A6B', // Intellect: muted deep slate
      WIS: '#7A5C1E', // Wisdom: muted ochre/antique bronze
      CHA: '#3F6B4F', // Charisma: muted forest/sage
    },

    // Semantic Colors (Used sparingly)
    danger: '#9C3D2A',
    overdue: '#9C3D2A',
    success: '#3F6B4F',
  },

  typography: {
    // Serif stack ending with Noto Serif Bengali for perfect ৳ glyph matching
    fontSerif: "'Source Serif 4', 'Newsreader', Georgia, 'Noto Serif Bengali', serif",
    // Clean Sans stack ending with Noto Sans Bengali
    fontSans: "'Source Sans 3', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif",

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
