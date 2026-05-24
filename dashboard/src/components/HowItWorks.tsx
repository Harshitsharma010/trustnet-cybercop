import { Icon } from "./Icon";

const steps = [
  {
    icon: "globe",
    title: "47 URL Signals",
    copy: "The backend extracts lexical, domain, keyword, encoding, impersonation, and structure signals.",
  },
  {
    icon: "cpu",
    title: "Hybrid ML Scoring",
    copy: "A compact tree model is blended with explainable risk signals to keep inference lightweight.",
  },
  {
    icon: "server",
    title: "Explainable API",
    copy: "The response includes verdict, score, confidence, model metadata, and ranked risk reasons.",
  },
  {
    icon: "cloud",
    title: "Free-tier Path",
    copy: "Fast scans avoid external fetches by default; deep scans run only when explicitly requested.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="how-section" aria-labelledby="how-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Detection pipeline</p>
          <h2 id="how-heading">How TrustNet CyberCop Works</h2>
        </div>
      </div>

      <div className="feature-grid">
        {steps.map((step) => (
          <article className="feature-card" key={step.title}>
            <span className="feature-icon">
              <Icon name={step.icon} />
            </span>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
