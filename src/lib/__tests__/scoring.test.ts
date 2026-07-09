import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSignal, type ScoringContext } from "../scoring.ts";

const CTX: ScoringContext = {
  recentHeadlines: [],
  pendingBeatCounts: {},
  agentSignalsIncluded: 0,
};

const DRAFT = {
  headline: "Agent registries converge on signed capability cards",
  body: "Discovery is useless without trust, so the registry designs gaining traction pair every listing with a signed capability card describing what the agent can do, who attests to it, and how to verify the signature offline without a central authority in the loop.",
  sources: [
    "https://www.w3.org/TR/did-core/",
    "https://github.com/projnanda/nandatown",
    "https://arxiv.org/abs/2310.08560",
  ],
  tags: ["registry", "identity", "trust"],
  beat: "protocols",
};

test("a well-formed submission scores per the published rubric", () => {
  const r = scoreSignal(DRAFT, CTX);
  assert.equal(r.breakdown.sourceCount, 20);
  assert.equal(r.breakdown.sourceQuality, 15); // w3.org + github.com + arxiv.org
  assert.equal(r.breakdown.headline, 10);
  assert.equal(r.breakdown.bodyDepth, 5); // 43 words → 25-49 band
  assert.equal(r.breakdown.tags, 10);
  assert.equal(r.breakdown.novelty, 15);
  assert.equal(r.breakdown.beatBalance, 15);
});

test("sourceQuality counts DISTINCT reputable domains, not URLs", () => {
  const r = scoreSignal(
    {
      ...DRAFT,
      sources: [
        "https://github.com/a/one",
        "https://github.com/b/two",
        "https://github.com/c/three",
      ],
    },
    CTX,
  );
  assert.equal(r.breakdown.sourceCount, 20); // three URLs
  assert.equal(r.breakdown.sourceQuality, 5); // one domain
});

test("near-duplicate headlines lose novelty", () => {
  const r = scoreSignal(DRAFT, {
    ...CTX,
    recentHeadlines: ["Agent registries converge on signed capability cards"],
  });
  assert.equal(r.breakdown.novelty, 0);
});

test("scoring is deterministic", () => {
  assert.deepEqual(scoreSignal(DRAFT, CTX), scoreSignal(DRAFT, CTX));
});

test("overcrowded beats earn the reduced beatBalance", () => {
  const r = scoreSignal(DRAFT, {
    ...CTX,
    pendingBeatCounts: { protocols: 9, models: 0 },
  });
  assert.equal(r.breakdown.beatBalance, 7);
});

test("invalid source URLs contribute nothing to quality", () => {
  const r = scoreSignal({ ...DRAFT, sources: ["not-a-url"] }, CTX);
  assert.equal(r.breakdown.sourceQuality, 0);
  assert.equal(r.breakdown.sourceCount, 10); // still one source by count
});
