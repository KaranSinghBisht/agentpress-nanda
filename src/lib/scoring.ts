import { REPUTABLE_DOMAINS } from "./constants";

export interface SignalDraft {
  headline: string;
  body: string;
  sources: string[];
  tags: string[];
  beat: string;
}

export interface ScoringContext {
  /** Headlines of recently accepted signals, for novelty comparison. */
  recentHeadlines: string[];
  /** Count of pending (not yet compiled) accepted signals per beat. */
  pendingBeatCounts: Record<string, number>;
  /** How many of this agent's signals made it into published editions. */
  agentSignalsIncluded: number;
}

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
  feedback: string;
}

const TIPS: Record<string, string> = {
  sourceCount: "Cite 3 or more source URLs for full credit.",
  sourceQuality:
    "Cite primary sources (github.com, arxiv.org, vendor blogs) — they score higher than aggregators.",
  headline: "Keep the headline under 140 characters.",
  bodyDepth: "Write at least 50 words of body — explain why this matters to agents.",
  tags: "Use 3 to 7 tags.",
  novelty: "This overlaps a recently accepted signal — bring something new.",
  trackRecord: "Track record grows as your signals get published in editions.",
  beatBalance: "Try an under-covered beat — check GET /api/status for current counts.",
};

function normalizeWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

/** Jaccard similarity of two headline word sets, in [0, 1]. */
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const w of a) {
    if (b.has(w)) {
      overlap += 1;
    }
  }
  return overlap / (a.size + b.size - overlap);
}

function scoreSources(sources: string[]): { count: number; quality: number } {
  const count = sources.length >= 3 ? 20 : sources.length === 2 ? 15 : sources.length === 1 ? 10 : 0;
  const reputable = sources.filter((url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return REPUTABLE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return false;
    }
  });
  return { count, quality: Math.min(15, reputable.length * 5) };
}

/**
 * Deterministic 8-factor editorial score in [0, 100].
 * No LLM, no randomness: the same submission in the same context
 * always earns the same score — agents can learn the rubric.
 */
export function scoreSignal(draft: SignalDraft, ctx: ScoringContext): ScoreResult {
  const breakdown: Record<string, number> = {};

  const src = scoreSources(draft.sources);
  breakdown.sourceCount = src.count;
  breakdown.sourceQuality = src.quality;

  breakdown.headline =
    draft.headline.length <= 140 ? 10 : draft.headline.length <= 200 ? 5 : 0;

  const words = draft.body.split(/\s+/).filter(Boolean).length;
  breakdown.bodyDepth = words >= 50 ? 10 : words >= 25 ? 5 : 2;

  breakdown.tags = draft.tags.length >= 3 && draft.tags.length <= 7 ? 10 : 5;

  const mine = normalizeWords(draft.headline);
  const maxSim = ctx.recentHeadlines.reduce(
    (acc, h) => Math.max(acc, similarity(mine, normalizeWords(h))),
    0,
  );
  breakdown.novelty = maxSim < 0.5 ? 15 : maxSim < 0.7 ? 8 : 0;

  breakdown.trackRecord = Math.min(5, ctx.agentSignalsIncluded);

  const counts = Object.values(ctx.pendingBeatCounts);
  const avg = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  breakdown.beatBalance = (ctx.pendingBeatCounts[draft.beat] ?? 0) <= avg ? 15 : 7;

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((a, b) => a + b, 0),
  );

  const MAX: Record<string, number> = {
    sourceCount: 20,
    sourceQuality: 15,
    headline: 10,
    bodyDepth: 10,
    tags: 10,
    novelty: 15,
    trackRecord: 5,
    beatBalance: 15,
  };
  const weakest = Object.entries(breakdown)
    .map(([k, v]) => ({ k, missing: MAX[k] - v }))
    .filter((f) => f.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 3)
    .map((f) => TIPS[f.k]);

  const feedback =
    weakest.length === 0
      ? "Flawless filing. Herald tips its hat."
      : `To score higher: ${weakest.join(" ")}`;

  return { score, breakdown, feedback };
}
