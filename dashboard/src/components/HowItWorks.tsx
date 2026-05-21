import { Icon } from "./Icon";

const steps = [
  {
    icon: "globe",
    title: "URL Feature Extraction",
    copy: "The backend converts the submitted URL into phishing-relevant signals for the model.",
  },
  {
    icon: "cpu",
    title: "ML Risk Classification",
    copy: "A RandomForest classifier evaluates the extracted features and returns a risk probability.",
  },
  {
    icon: "server",
    title: "Real-time Flask API",
    copy: "The dashboard calls lightweight `/health` and `/predict` endpoints with a simple JSON contract.",
  },
  {
    icon: "cloud",
    title: "Cloud-ready Deployment",
    copy: "The static frontend can point to any deployed backend by setting `VITE_API_BASE_URL`.",
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
