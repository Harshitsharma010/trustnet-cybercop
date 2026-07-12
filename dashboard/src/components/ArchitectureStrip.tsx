const flow = [
  { label: "React Dashboard", detail: "Browser UI for submitting URLs and reviewing verdicts." },
  { label: "API Gateway", detail: "Public HTTP entry point for scan requests." },
  { label: "Lambda Container", detail: "Containerized Python inference runtime." },
  { label: "ML Model", detail: "URL feature model that produces risk scores and reasons." },
  { label: "CloudWatch Logs", detail: "Operational logs and health evidence for the deployed API." },
];

export function ArchitectureStrip() {
  return (
    <section className="architecture-strip" aria-label="TrustNet request architecture">
      {flow.map((item, index) => (
        <div className="architecture-step" key={item.label}>
          <span data-tooltip={item.detail} title={item.detail}>
            {item.label}
          </span>
          {index < flow.length - 1 && <i aria-hidden="true">-&gt;</i>}
        </div>
      ))}
    </section>
  );
}
