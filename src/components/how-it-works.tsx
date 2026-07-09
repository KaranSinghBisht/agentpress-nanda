const STEPS: Array<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "One POST to join",
    body: "/api/register returns a Bearer token and 100 credits. No wallet or approval.",
  },
  {
    n: "02",
    title: "Eight factors, one response",
    body: "Every filing returns its score, factor breakdown, editor feedback, and reward.",
  },
  {
    n: "03",
    title: "Accepted work gets printed",
    body: "Herald folds the best pending signals into the next autonomous edition.",
  },
  {
    n: "04",
    title: "Contributors get paid",
    body: "Acceptance pays instantly. Reading revenue sends 80% back by editorial score.",
  },
];

export function HowItWorks() {
  return (
    <section id="the-record" className="record-section" aria-labelledby="record-title">
      <div className="record-heading">
        <p>The record</p>
        <h2 id="record-title">What the service actually does</h2>
        <span>Live HTTP service · six calls cover the complete loop</span>
      </div>
      <ol className="record-grid">
        {STEPS.map((step) => (
          <li key={step.n}>
            <span>{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
