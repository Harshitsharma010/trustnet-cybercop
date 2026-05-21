import { Icon } from "./Icon";

type StatCardProps = {
  icon: "activity" | "alert" | "check" | "clock";
  label: string;
  value: string;
  detail: string;
  tone: "info" | "safe" | "danger" | "neutral";
};

export function StatCard({ icon, label, value, detail, tone }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <span className="stat-icon">
        <Icon name={icon} />
      </span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
