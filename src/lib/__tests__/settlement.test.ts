import { test } from "node:test";
import assert from "node:assert/strict";
import { splitByWeight } from "../settlement.ts";

function lcg(seed: number) {
  let s = seed;
  return (max: number) => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s % max;
  };
}

test("conservation holds over 5000 random splits", () => {
  const rand = lcg(42);
  for (let t = 0; t < 5000; t++) {
    const n = 1 + rand(12);
    const recipients = Array.from({ length: n }, (_, i) => ({
      id: `agent-${i}`,
      weight: 1 + rand(500),
    }));
    const amount = rand(100000);
    const out = splitByWeight(amount, recipients);
    const total = out.reduce((a, o) => a + o.amount, 0);
    assert.equal(total, amount, `conservation violated at trial ${t}`);
    assert.ok(out.every((o) => Number.isInteger(o.amount) && o.amount >= 0));
  }
});

test("allocation is deterministic for identical input", () => {
  const recipients = [
    { id: "b", weight: 3 },
    { id: "a", weight: 7 },
    { id: "c", weight: 5 },
  ];
  assert.deepEqual(splitByWeight(1234, recipients), splitByWeight(1234, recipients));
});

test("single recipient receives the full amount", () => {
  assert.deepEqual(splitByWeight(77, [{ id: "solo", weight: 3 }]), [
    { id: "solo", amount: 77 },
  ]);
});

test("remainder ties break by id, deterministically", () => {
  const out = splitByWeight(1, [
    { id: "b", weight: 1 },
    { id: "a", weight: 1 },
  ]);
  assert.equal(out.find((x) => x.id === "a")?.amount, 1);
  assert.equal(out.find((x) => x.id === "b")?.amount, 0);
});

test("zero amount allocates zeros", () => {
  const out = splitByWeight(0, [
    { id: "a", weight: 1 },
    { id: "b", weight: 9 },
  ]);
  assert.ok(out.every((o) => o.amount === 0));
});

test("invalid inputs are rejected", () => {
  assert.throws(() => splitByWeight(-1, [{ id: "a", weight: 1 }]));
  assert.throws(() => splitByWeight(10, []));
  assert.throws(() => splitByWeight(10, [{ id: "a", weight: 0 }]));
  assert.throws(() => splitByWeight(10.5, [{ id: "a", weight: 1 }]));
});

test("80/20 marketplace split matches the documented economy", () => {
  const delta = 25;
  const pool = Math.floor((delta * 80) / 100);
  assert.equal(pool, 20);
  const out = splitByWeight(pool, [
    { id: "specwatch", weight: 95 },
    { id: "modelwire", weight: 85 },
    { id: "toolsmith", weight: 85 },
  ]);
  assert.equal(out.reduce((a, o) => a + o.amount, 0), pool);
});
