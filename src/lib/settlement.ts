export interface Recipient {
  id: string;
  weight: number;
}

export interface Allocation {
  id: string;
  amount: number;
}

/**
 * Largest-remainder allocation of an integer `amount` across recipients,
 * proportional to positive integer weights.
 *
 * Invariants (the same ones our NANDA Town split_settlement plugin proves):
 * - Conservation: sum(allocations) === amount, exactly. No dust is ever lost.
 * - Determinism: pure integer arithmetic; remainder ties break by id.
 */
export function splitByWeight(amount: number, recipients: Recipient[]): Allocation[] {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`amount must be a non-negative integer, got ${amount}`);
  }
  if (recipients.length === 0) {
    throw new Error("recipients must be non-empty");
  }
  for (const r of recipients) {
    if (!Number.isInteger(r.weight) || r.weight <= 0) {
      throw new Error(`weight for ${r.id} must be a positive integer`);
    }
  }

  const totalWeight = recipients.reduce((a, r) => a + r.weight, 0);
  const quotas = recipients.map((r) => {
    const exact = amount * r.weight;
    return {
      id: r.id,
      floor: Math.floor(exact / totalWeight),
      remainder: exact % totalWeight,
    };
  });

  let leftover = amount - quotas.reduce((a, q) => a + q.floor, 0);
  const byRemainder = [...quotas].sort(
    (a, b) => b.remainder - a.remainder || (a.id < b.id ? -1 : 1),
  );
  const bonus = new Set<string>();
  for (const q of byRemainder) {
    if (leftover === 0) {
      break;
    }
    bonus.add(q.id);
    leftover -= 1;
  }

  return quotas.map((q) => ({
    id: q.id,
    amount: q.floor + (bonus.has(q.id) ? 1 : 0),
  }));
}
