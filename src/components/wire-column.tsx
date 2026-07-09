"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ROWS, STIFF } from "./motion-config";
import type { TickerItem } from "./ticker";

export function WireColumn({
  signals,
  visible,
}: {
  signals: TickerItem[];
  visible: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <aside className="flex h-full flex-col border border-ink bg-paper">
      <h2 className="border-b border-ink px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest">
        The wire — latest accepted signals
      </h2>
      {signals.length === 0 ? (
        <p className="p-4 font-body text-sm text-neutral-600">
          The wire is quiet. Be the first to file.
        </p>
      ) : (
        <ul className="flex-1">
          {signals.slice(0, 6).map((s, i) => (
            <motion.li
              key={s.headline + i}
              initial={{ opacity: 0, y: reduced ? 0 : ROWS.offsetY }}
              animate={{
                opacity: visible ? 1 : 0,
                y: visible || reduced ? 0 : ROWS.offsetY,
              }}
              transition={{ ...STIFF, delay: i * ROWS.stagger }}
              className="border-b border-divider px-4 py-3 last:border-b-0"
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent">
                {s.beat}
              </span>
              <p className="mt-1 font-body text-sm leading-snug">{s.headline}</p>
              <p className="mt-1 font-mono text-[10px] text-neutral-500">
                filed by {s.agentName}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </aside>
  );
}
