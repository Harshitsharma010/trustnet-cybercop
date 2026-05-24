import type { BackendModelInfo, BackendModelMetrics, HealthState } from "../types";
import { Icon } from "./Icon";

type ModelInsightsProps = {
  healthState: HealthState;
  modelInfo: BackendModelInfo | null;
  modelMetrics: BackendModelMetrics | null;
};

function formatMetric(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 1000) / 10}%` : "--";
}

export function ModelInsights({ healthState, modelInfo, modelMetrics }: ModelInsightsProps) {
  const metrics = modelMetrics?.selected_metrics ?? modelInfo?.metrics_summary ?? {};
  const topFeatures = modelMetrics?.top_features?.slice(0, 6) ?? [];

  return (
    <section className="model-section" aria-labelledby="model-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Model evidence</p>
          <h2 id="model-heading">Detection Engine</h2>
        </div>
        <span className={`status-badge compact ${healthState === "healthy" ? "safe" : "neutral"}`}>
          <Icon name="cpu" />
          {modelInfo?.model_loaded ? "Model loaded" : "Model pending"}
        </span>
      </div>

      <div className="model-grid">
        <div className="model-summary">
          <dl>
            <div>
              <dt>Version</dt>
              <dd>{modelInfo?.model_version ?? "--"}</dd>
            </div>
            <div>
              <dt>Selected model</dt>
              <dd>{modelMetrics?.selected_model ?? modelInfo?.selected_model ?? "--"}</dd>
            </div>
            <div>
              <dt>Features</dt>
              <dd>{modelMetrics?.feature_count ?? modelInfo?.feature_count ?? "--"}</dd>
            </div>
            <div>
              <dt>Training samples</dt>
              <dd>{modelMetrics?.training_samples ?? "--"}</dd>
            </div>
          </dl>
        </div>

        <div className="metric-strip" aria-label="Model evaluation metrics">
          <div>
            <span>Accuracy</span>
            <strong>{formatMetric(metrics.accuracy)}</strong>
          </div>
          <div>
            <span>Precision</span>
            <strong>{formatMetric(metrics.precision)}</strong>
          </div>
          <div>
            <span>Recall</span>
            <strong>{formatMetric(metrics.recall)}</strong>
          </div>
          <div>
            <span>F1</span>
            <strong>{formatMetric(metrics.f1)}</strong>
          </div>
        </div>
      </div>

      <div className="feature-importance">
        <span>Top model signals</span>
        {topFeatures.length ? (
          <div className="feature-pills">
            {topFeatures.map((item) => (
              <code key={item.feature}>{item.feature}</code>
            ))}
          </div>
        ) : (
          <p>Start the backend to load model metrics.</p>
        )}
      </div>
    </section>
  );
}
