import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ExternalLink } from "lucide-react";
import type { VitalSeries } from "../../hooks/usePatientDetail";
import {
  evaluateVital,
  evaluateBloodPressure,
  statusColor,
  DEFINITIONS,
} from "../../utils/referenceRanges";
interface Props {
  open: boolean;
  vital: VitalSeries | null;
  onClose: () => void;
  context?: { hasHypertension?: boolean; hasCOPD?: boolean };
}

export function VitalDrawer({ open, vital, onClose, context }: Props) {
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = vital ? Math.max(...vital.history.map((h) => h.value), 1) : 1;
  const range = vital
    ? vital.code === "55284-4"
      ? evaluateBloodPressure(vital.latest, context)
      : evaluateVital(vital.code, parseFloat(vital.latest), context)
    : null;
  const def = vital ? DEFINITIONS[vital.code] : null;
  const colors = range ? statusColor(range.status) : null;
  const [showReference, setShowReference] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const referenceEndRef = useRef<HTMLDivElement>(null);
  console.log(
    "vital code:",
    vital?.code,
    "latest:",
    vital?.latest,
    "range:",
    range,
  );

  useEffect(() => {
    if (open) {
      setVisible(true);
      setShowReference(false);
    } else {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open && !visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-500"
        style={{ backgroundColor: "rgba(0,0,0,0.2)", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className="fixed top-2 right-2 bottom-2 w-[480px] z-50 flex flex-col bg-white rounded-lg border border-[#e5e5e5] overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -2px rgba(16,24,40,0.03), 0 12px 16px -4px rgba(16,24,40,0.08)",
          animation: open
            ? "slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            : "slideOutToRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          <div>
            <p className="text-[15px] font-medium text-sp-text-primary">
              {vital?.display}
            </p>
            <p className="text-[12px] text-sp-text-secondary">
              {vital?.history.length} records
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sp-text-secondary hover:text-sp-text-primary transition-colors p-1 rounded hover:bg-sp-bg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          {vital && (
            <>
              {/* Current value */}

              <div
                className="mb-5 p-4 rounded-lg"
                style={{ background: "#F9FAFB", border: "0.5px solid #E5E7EB" }}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[11px] text-sp-text-secondary">
                    Latest value · {vital.latestDate}
                  </p>
                  {range && colors && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{ background: colors.bg, color: colors.color }}
                    >
                      {range.label}
                    </span>
                  )}
                </div>
                <p className="text-[28px] font-medium text-sp-text-primary">
                  {vital.latest}
                  <span className="text-[14px] font-normal text-sp-text-secondary ml-1">
                    {vital.unit}
                  </span>
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{
                    color:
                      vital.trend === "up"
                        ? "#A32D2D"
                        : vital.trend === "down"
                          ? "#0F6E56"
                          : "#6B7280",
                  }}
                >
                  {vital.trend === "up"
                    ? "↑ Increasing"
                    : vital.trend === "down"
                      ? "↓ Decreasing"
                      : "→ Stable"}
                </p>
              </div>

              {/* History table */}
              <p className="text-[11px] font-medium uppercase tracking-wide text-sp-text-secondary mb-2">
                Full history
              </p>
              <table className="w-full text-[13px] mb-6">
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #E5E7EB" }}>
                    <th className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary">
                      Date
                    </th>
                    <th className="text-right pb-2 text-[11px] font-medium text-sp-text-secondary">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...vital.history].reverse().map((h, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: "0.5px solid #F3F4F6" }}
                      onMouseEnter={() =>
                        setHoveredIndex(vital.history.length - 1 - i)
                      }
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="transition-colors"
                    >
                      <td className="py-2 text-sp-text-secondary">{h.date}</td>
                      <td className="py-2 text-right font-medium text-sp-text-primary">
                        {h.value}
                        <span className="text-[11px] font-normal text-sp-text-secondary ml-1">
                          {vital.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bar chart with tooltip */}
              {vital.history.length > 1 && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-sp-text-secondary mb-3">
                    Trend
                  </p>
                  <div className="relative">
                    {/* Tooltip */}
                    {hoveredIndex !== null && (
                      <div
                        className="absolute -top-8 text-[11px] font-medium px-2 py-1 rounded pointer-events-none"
                        style={{
                          background: "#1A1A1A",
                          color: "white",
                          left: `calc(${((hoveredIndex + 0.5) / vital.history.length) * 100}% - 68px)`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {vital.history[hoveredIndex].date} ·{" "}
                        {vital.history[hoveredIndex].value} {vital.unit}
                      </div>
                    )}
                    <div
                      className="flex items-end gap-1"
                      style={{ height: "80px" }}
                    >
                      {vital.history.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm cursor-pointer transition-opacity"
                          style={{
                            height: `${Math.round((h.value / max) * 100)}%`,
                            background:
                              hoveredIndex === i
                                ? "#0F6E56"
                                : i === vital.history.length - 1
                                  ? "#1F5C5E"
                                  : "#A8C4C5",
                            opacity:
                              hoveredIndex !== null && hoveredIndex !== i
                                ? 0.5
                                : 1,
                          }}
                          onMouseEnter={() => setHoveredIndex(i)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-sp-text-secondary">
                        {vital.history[0]?.date}
                      </span>
                      <span className="text-[10px] text-sp-text-secondary">
                        {vital.history[vital.history.length - 1]?.date}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical reference — collapsed by default */}

              {range && def && (
                <div
                  className="mt-4 pt-3"
                  style={{ borderTop: "0.5px solid #F3F4F6" }}
                >
                  <button
                    onClick={() => {
                      const next = !showReference;
                      setShowReference(next);
                      if (next) {
                        setTimeout(() => {
                          const container = scrollRef.current;
                          if (!container) return;
                          const start = (container as HTMLDivElement).scrollTop;
                          const end =
                            container.scrollHeight - container.clientHeight;
                          const duration = 400;
                          const startTime = performance.now();

                          function animateScroll(currentTime: number) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const ease =
                              progress < 0.5
                                ? 2 * progress * progress
                                : -1 + (4 - 2 * progress) * progress;
                            if (container)
                              container.scrollTop =
                                start + (end - start) * ease;
                            if (progress < 1)
                              requestAnimationFrame(animateScroll);
                          }

                          requestAnimationFrame(animateScroll);
                        }, 150);
                      }
                    }}
                    className="flex items-center gap-2 text-[11px] font-medium hover:opacity-70 transition-opacity w-full text-left"
                    style={{ color: "#1F5C5E" }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background: "#E1F5EE", color: "#085041" }}
                    >
                      i
                    </span>
                    How this reference range is built
                    <ChevronDown
                      size={13}
                      style={{
                        marginLeft: "auto",
                        transform: showReference
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1F5C5E",
                      }}
                    />
                  </button>

                  {showReference && (
                    <div className="mt-3 space-y-3">
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: "0.5px solid #E5E7EB" }}
                      >
                        <div
                          className="px-4 py-2.5"
                          style={{
                            background: "#F9FAFB",
                            borderBottom: "0.5px solid #E5E7EB",
                          }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary">
                            Reference ranges
                          </p>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {[
                            {
                              label: "Normal",
                              value: range.range.normal,
                              status: "normal" as const,
                            },
                            {
                              label: "Watch",
                              value: range.range.watch,
                              status: "watch" as const,
                            },
                            {
                              label: "Out of range",
                              value: range.range.critical,
                              status: "critical" as const,
                            },
                          ].map((row) => {
                            const c = statusColor(row.status);
                            return (
                              <div
                                key={row.label}
                                className="flex items-start gap-3"
                              >
                                <span
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                                  style={{ background: c.bg, color: c.color }}
                                >
                                  {row.label}
                                </span>
                                <span className="text-[12px] text-sp-text-secondary">
                                  {row.value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div
                          className="px-4 py-2.5 space-y-2"
                          style={{ borderTop: "0.5px solid #E5E7EB" }}
                        >
                          <p className="text-[11px] text-sp-text-secondary leading-relaxed">
                            {range.basis.rationale}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: "#9CA3AF" }}
                          >
                            {range.basis.population}
                          </p>
                          <a
                            href={range.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:opacity-70 transition-opacity"
                            style={{ color: "#1F5C5E" }}
                          >
                            <ExternalLink size={11} />
                            {`${range.source.label} · ${range.source.year}`}
                          </a>
                        </div>
                      </div>

                      <div
                        ref={referenceEndRef}
                        className="px-3 py-2.5 rounded-lg"
                        style={{
                          background: "#F9FAFB",
                          border: "0.5px solid #E5E7EB",
                        }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary mb-1">
                          Clinical disclaimer
                        </p>
                        <p
                          className="text-[11px] leading-relaxed"
                          style={{ color: "#6B7280" }}
                        >
                          {def.clinicalDisclaimer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
