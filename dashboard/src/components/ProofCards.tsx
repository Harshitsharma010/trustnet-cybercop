import { Icon } from "./Icon";

const proofCards = [
  {
    icon: "cloud",
    label: "AWS Pipeline",
    title: "Lambda, API Gateway, ECR, Amplify",
    copy: "Static dashboard calls a deployed API path backed by a containerized inference service.",
    tags: ["Lambda", "API Gateway", "ECR", "Amplify"],
  },
  {
    icon: "cpu",
    label: "Model Signals",
    title: "47 URL features, RandomForest, explainable reasons",
    copy: "URL structure, domain tokens, path keywords, and model probability are shown as inspectable evidence.",
    tags: ["47 features", "RandomForest", "Reasons"],
  },
  {
    icon: "activity",
    label: "Observability",
    title: "CloudWatch logs, health endpoint, response checks",
    copy: "The project includes operational proof for health checks, API behavior, and AWS deployment visibility.",
    tags: ["CloudWatch", "Health", "Checks"],
  },
] as const;

export function ProofCards() {
  return (
    <section className="proof-section" aria-labelledby="proof-heading">
      <div className="section-heading compact">
        <div>
          <p className="kicker">Deployment Proof</p>
          <h2 id="proof-heading">Built like a working security project.</h2>
        </div>
      </div>

      <div className="proof-grid">
        {proofCards.map((card) => (
          <article className="proof-card" key={card.label}>
            <span className="proof-icon">
              <Icon name={card.icon} />
            </span>
            <span>{card.label}</span>
            <strong>{card.title}</strong>
            <p>{card.copy}</p>
            <div className="proof-tags" aria-label={`${card.label} evidence`}>
              {card.tags.map((tag) => (
                <code key={tag}>{tag}</code>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
