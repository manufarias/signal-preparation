import { useState, useEffect } from "react";
import { Activity, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    id: 1,
    tag: "Patient → Clinician",
    title: "Information that arrives with value",
    description:
      "Signal structures what the patient reports and delivers it to the clinician only when it matters — at the right moment, in the right format.",
    visual: (
      <div className="flex flex-col gap-3">
        <div
          className="px-4 py-3 rounded-xl text-[13px] italic leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          "I have not been able to sleep properly for almost a month. I wake up
          at 3am every night."
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-px flex-1"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Signal processes
          </span>
          <div
            className="h-px flex-1"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: "Sensation",
              prev: "Inability to fall asleep",
              curr: "Early waking",
            },
            { label: "Intensity", prev: "4/10", curr: "7/10" },
          ].map((item) => (
            <div
              key={item.label}
              className="px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.1)",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wide mb-1"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {item.label}
              </p>
              <p
                className="text-[11px] line-through mb-0.5"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {item.prev}
              </p>
              <p
                className="text-[12px] font-medium"
                style={{ color: "#A8C4C5" }}
              >
                {item.curr}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    tag: "Master detail",
    title: "Full clinical context in 10 seconds",
    description:
      "The app surfaces what's available — coverage, conditions, Signal episode, key indicators — the moment you open a chart. No searching, no clicking.",
    visual: (
      <div className="flex flex-col gap-2">
        {[
          {
            label: "Health insurance",
            value: "Active · Dec 2026",
            color: "#A8C4C5",
          },
          {
            label: "Active conditions",
            value: "Stress · Hypertension",
            color: "rgba(255,255,255,0.8)",
          },
          {
            label: "Signal episode",
            value: "⚠ Worsening pattern",
            color: "#F5CBA7",
          },
          {
            label: "Heart rate",
            value: "90 /min  ↑ Increasing",
            color: "#A8C4C5",
          },
        ].map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="text-[11px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {row.label}
            </span>
            <span
              className="text-[12px] font-medium"
              style={{ color: row.color }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 3,
    tag: "Command palette",
    title: "Get where you need to go — fast",
    description:
      "Every patient, every action, one keystroke away. Ctrl+K opens the command palette. No menus, no navigation, no time lost.",
    visual: (
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "0.5px solid rgba(255,255,255,0.2)",
          }}
        >
          <span
            className="text-[12px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            ⌘
          </span>
          <span
            className="text-[13px]"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Go to patient...
          </span>
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Ctrl+K
          </span>
        </div>
        {[
          "Shalanda Treutel · 34y · F",
          "Dwana Tremblay · 45y · F",
          "Sandra Rodriguez · 53y · F",
        ].map((name, i) => (
          <div
            key={name}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            style={{
              background: i === 0 ? "rgba(168,196,197,0.15)" : "transparent",
              border:
                i === 0
                  ? "0.5px solid rgba(168,196,197,0.3)"
                  : "0.5px solid transparent",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {name[0]}
            </div>
            <span
              className="text-[12px]"
              style={{
                color:
                  i === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

interface Props {
  onStart: () => void;
}

export function LandingPage({ onStart }: Props) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {}, []);

  useEffect(() => {
    const audio = new Audio("/sounds/Soft Piano Notes.mp3");
    audio.preload = "auto";
    audio.load();
  }, []);

  function goTo(index: number) {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  }

  const feature = FEATURES[current];

  return (
    <div
      className="min-h-screen flex overflow-hidden transition-opacity duration-700"
      style={{ background: "#F0F4F4", opacity: fadingOut ? 0 : 1 }}
    >
      {/* Right panel — features */}
      <div
        className="w-1/2 flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#1F5C5E" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-[6px]">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Activity size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">
            Signal
          </span>
          <span
            className="text-[15px] font-normal tracking-tight"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Prep
          </span>
        </div>

        {/* Feature content */}
        <div
          className="flex-1 flex flex-col justify-center py-8 transition-opacity duration-300"
          style={{ opacity: animating ? 0 : 1 }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest mb-3 inline-block"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {feature.tag}
          </span>
          <h2 className="text-[26px] font-semibold text-white leading-tight mb-3">
            {feature.title}
          </h2>
          <p
            className="text-[14px] leading-relaxed mb-6"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {feature.description}
          </p>
          <div>{feature.visual}</div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                goTo((current - 1 + FEATURES.length) % FEATURES.length)
              }
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{
                border: "0.5px solid rgba(255,255,255,0.25)",
                color: "white",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className="text-[12px]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {current + 1} / {FEATURES.length}
            </span>
            <button
              onClick={() => goTo((current + 1) % FEATURES.length)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{
                border: "0.5px solid rgba(255,255,255,0.25)",
                color: "white",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Left panel — entry */}
      <div
        className="w-1/2 flex flex-col items-center justify-center px-14"
        style={{ background: "#F0F4F4" }}
      >
        <div className="flex flex-col items-center text-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "#1F5C5E" }}
          >
            <Activity size={26} className="text-white" />
          </div>

          <div>
            <h1
              className="text-[28px] font-semibold leading-tight mb-2"
              style={{ color: "#1A1A1A" }}
            >
              Know your patient
              <br />
              before they walk in.
            </h1>
          </div>

          <button
            onClick={() => {
              setFadingOut(true);
              setTimeout(() => onStart(), 600);
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-medium transition-all hover:shadow-lg "
            style={{
              background: "white",
              color: "#1F5C5E",
              border: "1px solid #E5E7EB",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
              minWidth: "240px",
            }}
          >
            Enter Signal Prep
          </button>
          <p className="text-[13px]" style={{ color: "#9CA3AF" }}>
            signalprep.work
          </p>
        </div>
      </div>
    </div>
  );
}
