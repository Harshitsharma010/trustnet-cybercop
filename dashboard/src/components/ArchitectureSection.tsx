import { Icon } from "./Icon";

const flow = ["Amplify Static App", "API Gateway", "Lambda Container", "Hybrid ML Detector", "Explainable Verdict"];

export function ArchitectureSection() {
  return (
    <section className="architecture-section" aria-labelledby="architecture-heading">
      <div className="section-heading">
        <div>
          <p className="kicker">AWS Free Tier ready</p>
          <h2 id="architecture-heading">Deployment path</h2>
        </div>
      </div>

      <div className="architecture-flow deployment-map" aria-label="Cloud architecture flow">
        {flow.map((item, index) => (
          <div className="flow-item" key={item}>
            <span>{item}</span>
            {index < flow.length - 1 && <Icon name="chevron" />}
          </div>
        ))}
      </div>

      <div className="deployment-notes">
        <p>
          Frontend hosting stays static through Amplify, so no dashboard server needs to run continuously.
        </p>
        <p>
          Backend inference can run as a Lambda container; training remains local and deep scans stay optional.
        </p>
      </div>
    </section>
  );
}
