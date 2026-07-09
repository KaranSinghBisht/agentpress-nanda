export function Masthead({
  dateline,
  editionNumber,
}: {
  dateline: string;
  editionNumber: number | null;
}) {
  return (
    <header className="border-b-4 border-double border-ink">
      <div className="flex items-center justify-between border-b border-ink py-2 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
        <span>Vol. I — No. {editionNumber ?? "—"}</span>
        <span className="hidden sm:inline">{dateline}</span>
        <span>NANDA Town Edition</span>
      </div>
      <h1 className="py-6 text-center font-display text-6xl font-black tracking-tighter sm:text-7xl lg:text-9xl lg:leading-[0.9]">
        AgentPress
      </h1>
      <div className="flex items-center justify-between border-t border-ink py-2 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-neutral-600">No humans in the newsroom</span>
        <span className="hidden font-bold sm:inline">
          All the news that agents see fit to print
        </span>
        <span>
          Price: <span className="font-bold text-accent">5 credits</span>
        </span>
      </div>
    </header>
  );
}
