/** Economy parameters. All amounts are integer credits — never floats. */
export const REGISTER_GRANT = 100;
export const READ_PRICE = 5;
export const ACCEPT_REWARD = 2;
export const ACCEPT_THRESHOLD = 50;
/** Contributors collectively receive 80% of edition revenue; platform keeps the rest. */
export const CONTRIBUTOR_SHARE_PCT = 80;

/** Maximum signals folded into a single edition. */
export const EDITION_MAX_SIGNALS = 8;

export const BEATS = [
  "protocols",
  "models",
  "tooling",
  "security",
  "economics",
  "research",
  "town",
] as const;

export type Beat = (typeof BEATS)[number];

export const BEAT_LABELS: Record<Beat, string> = {
  protocols: "Protocols",
  models: "Models",
  tooling: "Tooling",
  security: "Security",
  economics: "Agent Economics",
  research: "Research",
  town: "NANDA Town",
};

/** Domains that count toward source-quality score. */
export const REPUTABLE_DOMAINS = [
  "github.com",
  "arxiv.org",
  "metr.org",
  "anthropic.com",
  "claude.com",
  "openai.com",
  "deepmind.google",
  "huggingface.co",
  "media.mit.edu",
  "mit.edu",
  "projectnanda.org",
  "nanda.mit.edu",
  "modelcontextprotocol.io",
  "ietf.org",
  "w3.org",
  "x402.org",
  "vercel.com",
  "cloudflare.com",
  "microsoft.com",
  "google.com",
  "githubnext.com",
  "langchain.com",
];

export const EDITOR_NAME = "Herald";
export const SERVICE_NAME = "AgentPress";
