/**
 * Newsprint motion vocabulary: fast, snappy, mechanical.
 * Stiff springs and sharp ease-out curves only — nothing bouncy, nothing soft.
 */
export const TIMING = {
  masthead: 80, // ms — metadata + rules settle first
  stats: 260, // ms — the counters start rolling
  hero: 420, // ms — front-page story slides up
  wire: 560, // ms — right column follows
  press: 700, // ms — inverted how-it-works band
  board: 840, // ms — leaderboard rows + terminal stagger in
} as const;

export const STIFF = { type: "spring", stiffness: 350, damping: 28 } as const;
export const SMOOTH = { type: "spring", stiffness: 300, damping: 30 } as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const ROWS = {
  stagger: 0.04, // s — dense newspaper rows: rapid waterfall
  offsetY: 8,
} as const;
