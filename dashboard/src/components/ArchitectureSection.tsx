import { Icon } from "./Icon";

const flow = ["React Dashboard", "API Gateway / Load Balancer", "Flask API", "ML Model", "Prediction Response"];

export function ArchitectureSection() {
  return (
    <section className="architecture-section" aria-labelledby="architecture-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AWS Free Tier ready</p>
          <h2 id="architecture-heading">Cloud Ready Architecture</h2>
        </div>
      </div>

      <div className="architecture-flow" aria-label="Cloud architecture flow">
        {flow.map((item, index) => (
          <div className="flow-item" key={item}>
            <span>{item}</span>
            {index < flow.length - 1 && <Icon name="chevron" />}
          </div>
        ))}
      </div>

      <div className="deployment-notes">
        <p>
          Frontend hosting fits AWS Amplify or S3 + CloudFront because the dashboard builds to static assets.
        </p>
        <p>
          The Flask backend can run separately on AWS App Runner, ECS, or EC2 Free Tier depending on the deployment path.
        </p>
      </div>
    </section>
  );
}
