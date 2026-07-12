const scans = [
  { host: "paypal-security-login.xyz", status: "Dangerous", score: 87, tone: "danger" },
  { host: "github.com", status: "Safe", score: 12, tone: "safe" },
  { host: "secure-login-update.com", status: "Suspicious", score: 64, tone: "warning" },
] as const;

export function RecentScansTimeline() {
  return (
    <section className="recent-scans" aria-labelledby="recent-scans-heading">
      <div className="recent-scans-heading">
        <span>Recent scans</span>
        <strong id="recent-scans-heading">Session timeline</strong>
      </div>
      <div className="timeline-list">
        {scans.map((scan) => (
          <article className={`timeline-item ${scan.tone}`} key={scan.host}>
            <span>{scan.host}</span>
            <strong>{scan.status}</strong>
            <code>{scan.score}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
