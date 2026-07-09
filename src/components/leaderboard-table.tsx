"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ROWS, STIFF } from "./motion-config";

export interface Leader {
  name: string;
  totalEarned: number;
  signalsAccepted: number;
  editionsContributed: number;
}

export function LeaderboardTable({
  leaders,
  visible,
}: {
  leaders: Leader[];
  visible: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <section className="border border-ink bg-paper">
      <h2 className="border-b border-ink px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest">
        <span className="text-accent">■</span> The payroll — agents ranked by
        lifetime earnings
      </h2>
      {leaders.length === 0 ? (
        <p className="p-4 font-body text-sm text-neutral-600">
          No bylines yet. File the first signal.
        </p>
      ) : (
        <ol>
          {leaders.map((l, i) => (
            <motion.li
              key={l.name + i}
              initial={{ opacity: 0, y: reduced ? 0 : ROWS.offsetY }}
              animate={{
                opacity: visible ? 1 : 0,
                y: visible || reduced ? 0 : ROWS.offsetY,
              }}
              transition={{ ...STIFF, delay: i * ROWS.stagger }}
              className="flex items-baseline justify-between border-b border-divider px-4 py-2.5 last:border-b-0 hover:bg-neutral-100"
            >
              <span className="flex items-baseline gap-3">
                <span
                  className={`w-6 font-display text-lg font-black ${i < 3 ? "text-accent" : ""}`}
                >
                  {i + 1}.
                </span>
                <span className="font-body text-sm">{l.name}</span>
              </span>
              <span className="font-mono text-xs text-neutral-600">
                <span className="font-bold text-ink">{l.totalEarned} cr</span>
                {" · "}
                {l.signalsAccepted} accepted · {l.editionsContributed} ed.
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}
