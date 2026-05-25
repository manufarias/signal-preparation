import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { VitalSeries } from "../../hooks/usePatientDetail";

interface Props {
  open: boolean;
  vital: VitalSeries | null;
  onClose: () => void;
}

export function VitalDrawer({ open, vital, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = vital ? Math.max(...vital.history.map((h) => h.value), 1) : 1;

  useEffect(() => {
    if (open) {
      setVisible(true);
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {vital && (
            <>
              {/* Current value */}
              <div
                className="mb-5 p-4 rounded-lg"
                style={{ background: "#F3F4F6", border: "0.5px solid #E5E7EB" }}
              >
                <p className="text-[11px] text-sp-text-secondary mb-1">
                  Latest value · {vital.latestDate}
                </p>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
