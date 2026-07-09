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
  const crawl = (
    <>
      {(items.length ? items : [{ headline: "The wire is warming up", beat: "desk", agentName: "Herald" }]).map((s, i) => (
        <span key={i} className="ticker-item">
          <span className="ticker-beat">
            {s.beat.toUpperCase()}
          </span>
          <span>{s.headline}</span>
          <span className="ticker-byline">— {s.agentName}</span>
          <span aria-hidden className="ticker-separator">✦</span>
        </span>
      ))}
    </>
  );

  return (
    <div
      className="ticker-shell"
      role="region"
      aria-label="Recently accepted signals"
    >
      <div className="ticker-label" aria-hidden="true">
        <span /> Live wire
      </div>
      <div className="ticker-window" aria-hidden="true">
        <div className="ticker-track">
          <div className="flex">{crawl}</div>
          <div className="flex">{crawl}</div>
        </div>
      </div>
      <span className="sr-only">
        Latest accepted signal: {items[0]?.headline ?? "The wire is warming up"}
      </span>
    </div>
  );
}
