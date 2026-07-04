import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { RiskTone } from "../types";

type ThreatCoreProps = {
  tone: RiskTone;
  loading: boolean;
};

const particles = Array.from({ length: 8 }, (_, index) => index);

export function ThreatCore({ tone, loading }: ThreatCoreProps) {
  return (
    <div className={`threat-core ${tone} ${loading ? "scanning" : ""}`} aria-hidden="true">
      <div className="threat-ring outer" />
      <div className="threat-ring inner" />
      <div className="threat-orbit">
        {particles.map((particle) => (
          <i key={particle} style={{ "--particle": particle } as CSSProperties} />
        ))}
      </div>
      <motion.div
        className="threat-shield"
        animate={{
          scale: loading ? [1, 1.06, 1] : [1, 1.025, 1],
          opacity: loading ? [0.72, 1, 0.72] : [0.68, 0.82, 0.68],
        }}
        transition={{ duration: loading ? 0.8 : 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 48 56" aria-hidden="true">
          <path d="M24 3 42 10v14c0 13.5-7.2 22.8-18 28.5C13.2 46.8 6 37.5 6 24V10L24 3Z" />
          <path d="m16 27 5.4 5.4L33 19.8" />
        </svg>
      </motion.div>
    </div>
  );
}
