import { motion } from "framer-motion";
import type { ScanResult } from "../types";

type SignalState = "danger" | "warning" | "safe" | "neutral";

type Signal = {
  label: string;
  state: SignalState;
  detail: string;
};

function buildSignals(result: ScanResult | null): Signal[] {
  const status = result?.status;
  const hasResult = Boolean(result);
  const isSafe = status === "Safe";
  const isSuspicious = status === "Suspicious";

  return [
    {
      label: "Brand keyword",
      state: !hasResult || isSafe ? "neutral" : "danger",
      detail: !hasResult ? "Brand impersonation check is ready." : isSafe ? "No impersonation keyword found." : "Payment brand appears outside the official domain.",
    },
    {
      label: "Login path",
      state: !hasResult || isSafe ? "neutral" : "danger",
      detail: !hasResult ? "Credential path check is ready." : isSafe ? "No credential path terms detected." : "Login or verify wording appears in the path.",
    },
    {
      label: "Risky TLD",
      state: !hasResult || isSafe ? "neutral" : isSuspicious ? "warning" : "danger",
      detail: "Domain suffix and host pattern are compared against risky URL traits.",
    },
    {
      label: "URL length",
      state: !hasResult ? "neutral" : isSafe ? "safe" : "warning",
      detail: "Long or segmented URLs can hide phishing intent.",
    },
    {
      label: "HTTPS",
      state: !hasResult ? "neutral" : result?.url.startsWith("https://") ? "safe" : "danger",
      detail: "Checks whether the URL uses HTTPS.",
    },
    {
      label: "Domain structure",
      state: !hasResult ? "neutral" : isSafe ? "safe" : "danger",
      detail: "Hyphenation, subdomain shape, and hostname composition are scored.",
    },
    {
      label: "Encoded chars",
      state: "neutral",
      detail: "Encoded or obfuscated characters increase suspicion when present.",
    },
    {
      label: "Shortener",
      state: "neutral",
      detail: "Known URL shorteners are treated as additional risk context.",
    },
  ];
}

export function URLSignalGraph({ result }: { result: ScanResult | null }) {
  const signals = buildSignals(result);

  return (
    <motion.div
      className="signal-graph"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="signal-graph-heading">
        <span>URL signal graph</span>
        <strong>{signals.filter((signal) => signal.state === "danger").length} hot</strong>
      </div>
      <div className="signal-node-grid">
        {signals.map((signal, index) => (
          <motion.span
            className={`signal-node ${signal.state}`}
            key={signal.label}
            title={signal.detail}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.025, duration: 0.18 }}
          >
            {signal.label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
