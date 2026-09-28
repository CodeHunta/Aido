/** Aido DS v0.1 — Tailwind theme mapping (apps/web)
 *  Source: packages/design-tokens/tokens.json
 *  Usage (Tailwind v3): require('./tailwind.theme.js') and spread into tailwind.config.js
 *  shadcn/ui: map buy/hold/sell/watch to Badge variants in components/ui/badge.tsx
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--card)',
        border: 'var(--border)',
        ink: '#0f172a',
        buy: { DEFAULT: '#16a34a', bg: '#dcfce7', fg: '#166534' },
        hold: { DEFAULT: '#d97706', bg: '#fef3c7', fg: '#92400e' },
        sell: { DEFAULT: '#dc2626', bg: '#fee2e2', fg: '#991b1b' },
        watch: { DEFAULT: '#2563eb', bg: '#dbeafe', fg: '#1e40af' },
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
};
