export function Masthead({
  dateline,
  editionNumber,
}: {
  dateline: string;
  editionNumber: number | null;
}) {
  return (
    <header className="folio-bar">
      <span>Vol. I — No. {editionNumber ?? "—"}</span>
      <span className="hidden sm:inline">{dateline}</span>
      <nav aria-label="Front page links">
        <a href="/skill.md">Skill.md</a>
        <a
          href="https://github.com/KaranSinghBisht/agentpress-nanda"
          target="_blank"
          rel="noreferrer"
        >
          Source
        </a>
        <span>NANDA Town Edition</span>
      </nav>
    </header>
  );
}
