/** Aido DS v0.1 — NativeWind theme mapping (apps/mobile)
 *  Source: packages/design-tokens/tokens.json
 *  Usage: import { aidoTheme } from '@aido/design-tokens/nativewind.theme';
 *  <ActionBadge action="BUY" /> must accept the same props as web.
 */
export const aidoTheme = {
  color: {
    buy: '#16a34a',
    hold: '#d97706',
    sell: '#dc2626',
    watch: '#2563eb',
    buyBg: '#dcfce7',
    holdBg: '#fef3c7',
    sellBg: '#fee2e2',
    watchBg: '#dbeafe',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  scoreThresholds: { buy: 75, watch: 65, hold: 50, sell: 40 },
  components: ['ScoreRing', 'ActionBadge', 'ConfidencePill', 'SuitabilityBadge', 'AllocationBar'],
};
