/**
 * Shared UI color + typography tokens for the weaving machine app.
 *
 * Centralizing these keeps the dark kilim-inspired palette consistent across
 * components, and means design tweaks happen in exactly one place.
 */

export const uiColors = {
  background: '#1a1a1a',
  surface: '#1e1e1e',
  surfaceRaised: '#2a2a2a',
  surfaceSunken: '#141414',
  border: '#444',
  borderSubtle: '#333',
  textPrimary: '#e8e0d4',
  textSecondary: '#aaa',
  textMuted: '#888',
  textDim: '#666',
  accentGold: '#e8d090',
  accentBlue: '#3a6ea8',
  accentBrown: '#6b4a2a',
  accentGreen: '#4a7a40',
  warning: '#e08060',
} as const;
