import type { HealthState } from "../types";
import { Icon } from "./Icon";

type NavbarProps = {
  healthState: HealthState;
  healthDetail: string;
  onRefreshHealth: () => void;
};

const healthLabels: Record<HealthState, string> = {
  checking: "Checking",
  healthy: "Healthy",
  offline: "Offline",
};

export function Navbar({ healthState, healthDetail, onRefreshHealth }: NavbarProps) {
  return (
    <header className="navbar">
      <a className="brand" href="/" aria-label="TrustNet CyberCop dashboard home">
        <span className="brand-mark">
          <Icon name="shield" />
        </span>
        <span>
          <strong>TrustNet CyberCop</strong>
          <small>AI-powered phishing URL detection</small>
        </span>
      </a>

      <div className="nav-actions">
        <button
          className={`health-chip ${healthState}`}
          type="button"
          onClick={onRefreshHealth}
          title={healthDetail}
          aria-label={`Backend status: ${healthLabels[healthState]}. Refresh health check.`}
        >
          <span className="health-dot" />
          {healthLabels[healthState]}
          <Icon name="refresh" className={healthState === "checking" ? "spin" : ""} />
        </button>

        <a
          className="github-link"
          href="https://github.com/Harshitsharma010/trustnet-cybercop"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="github" />
          GitHub
        </a>
      </div>
    </header>
  );
}
