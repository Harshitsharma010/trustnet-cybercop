import type { ScanResult } from "../types";
import { getRiskTone } from "../utils/risk";
import { Icon } from "./Icon";

type ScanHistoryProps = {
  history: ScanResult[];
  selectedId?: string;
  onSelect: (result: ScanResult) => void;
  onClear: () => void;
};

function formatRisk(value: number | null) {
  return value === null ? "Not reported" : `${value}%`;
}

function formatResponseTime(value: number | null) {
  return value === null ? "Not reported" : `${value} ms`;
}

function formatScanTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ScanHistory({ history, selectedId, onSelect, onClear }: ScanHistoryProps) {
  return (
    <section className="history-section" aria-labelledby="history-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Session intelligence</p>
          <h2 id="history-heading">Recent scan history</h2>
        </div>
        <button className="secondary-button" type="button" onClick={onClear} disabled={history.length === 0}>
          Clear history
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          <Icon name="activity" />
          <strong>No scans in this session</strong>
          <p>Run a scan to populate the local history table. Nothing is sent to a database.</p>
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Status</th>
                <th>Risk %</th>
                <th>Response time</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const tone = getRiskTone(item.status);

                return (
                  <tr key={item.id} className={selectedId === item.id ? "selected" : ""}>
                    <td data-label="URL">
                      <button className="history-url" type="button" onClick={() => onSelect(item)} title={item.url}>
                        {item.url}
                      </button>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge compact ${tone}`}>{item.status}</span>
                    </td>
                    <td data-label="Risk %">{formatRisk(item.riskScore)}</td>
                    <td data-label="Response time">{formatResponseTime(item.responseTimeMs)}</td>
                    <td data-label="Time">{formatScanTime(item.scannedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
