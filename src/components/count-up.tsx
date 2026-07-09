"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const DURATION_MS = 600;

/** easeOutCubic — mount-phase drama, per the live-data recipe. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Rolls from 0 to `value` once on mount; instant under reduced motion. */
export function CountUp({ value, start }: { value: number; start: boolean }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!start || done.current || reduced || value === 0) {
      return;
    }
    done.current = true;
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - t0) / DURATION_MS);
      setShown(Math.round(ease(progress) * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value, reduced]);

  const displayed = start && (reduced || value === 0) ? value : shown;

  return (
    <span className="tabular-nums">{displayed.toLocaleString("en-US")}</span>
  );
}
