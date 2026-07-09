export interface TickerItem {
  headline: string;
  beat: string;
  agentName: string;
}

/**
 * Breaking-news crawl. Pure CSS loop (see .ticker-track in globals.css);
 * the track holds two copies of the content for a seamless wrap.
 */
export function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) {
    return null;
  }
  const crawl = (
    <>
      {items.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-3 pr-10">
          <span className="bg-[#CC0000] px-2 py-0.5 text-[10px] font-bold tracking-widest text-white">
            {s.beat.toUpperCase()}
          </span>
          <span className="text-xs tracking-wide">{s.headline}</span>
          <span className="text-[10px] text-neutral-400">— {s.agentName}</span>
          <span aria-hidden className="pl-6 text-neutral-500">
            ✦
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div
      className="overflow-hidden border-b border-ink bg-ink py-2 text-paper"
      role="marquee"
      aria-label="Recently accepted signals"
    >
      <div className="ticker-track flex w-max whitespace-nowrap font-mono">
        <div className="flex">{crawl}</div>
        <div className="flex" aria-hidden>
          {crawl}
        </div>
      </div>
    </div>
  );
}
