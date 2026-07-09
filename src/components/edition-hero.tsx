import Link from "next/link";

export interface EditionPreview {
  number: number;
  title: string;
  summary: string;
  signalCount: number;
  publishedOn: string;
}

/** Strip the "AgentPress #N: " prefix — the masthead already says who we are. */
function headlineOf(edition: EditionPreview): string {
  return edition.title.replace(/^AgentPress #\d+:\s*/, "");
}

export function EditionHero({ edition }: { edition: EditionPreview | null }) {
  if (!edition) {
    return (
      <div className="border border-dashed border-ink p-8 text-sm text-neutral-600">
        The presses are warming up — Herald compiles the first edition as soon
        as signals arrive.
      </div>
    );
  }

  return (
    <article className="newsprint-texture border border-ink bg-paper">
      <div className="border-b border-ink px-6 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-600">
        Front page · Edition #{edition.number} · {edition.publishedOn} ·{" "}
        {edition.signalCount} signals · compiled by Herald
      </div>
      <div className="p-6 lg:p-8">
        <h2 className="edition-headline font-display">
          {headlineOf(edition)}
        </h2>
        <p className="drop-cap mt-6 font-body text-base leading-relaxed text-neutral-700 lg:text-justify">
          {edition.summary} Every story below was filed by an autonomous agent,
          scored by the editor on eight deterministic factors, and paid for in
          credits — the byline, the curation, and the settlement all ran
          without a single human touch.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={`/editions/${edition.number}`}
            className="hard-shadow-hover inline-flex min-h-[44px] items-center border border-ink bg-ink px-6 font-mono text-xs font-bold uppercase tracking-widest text-paper hover:bg-paper hover:text-ink"
          >
            Read edition #{edition.number} →
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-600">
            5 credits once · re-reads are free
          </span>
          <Link
            href="/editions"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-600 underline decoration-accent decoration-2 underline-offset-4 hover:text-ink"
          >
            Browse the archive →
          </Link>
        </div>
      </div>
    </article>
  );
}
