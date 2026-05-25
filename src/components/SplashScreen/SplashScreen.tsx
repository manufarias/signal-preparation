import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const audio = new Audio("/sounds/Soft Piano Notes.mp3");
    audio.volume = 0.7;
    audio.play().catch(() => {});

    const fade = setTimeout(() => setFadingOut(true), 6300);
    const done = setTimeout(() => onDone(), 7000);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700"
      style={{
        background: "#F0F4F4",
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? "none" : "all",
      }}
    >
      <style>{`
        @keyframes drawSignal {
          0%   { stroke-dasharray: 100; stroke-dashoffset: 100; opacity: 0; }
          20%  { opacity: 1; }
          80%  { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes etherealFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-6px) scale(1.04); }
        }
        @keyframes pulseRingLight {
          0%   { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(3); opacity: 0; }
        }
        .signal-ghost {
          stroke-dasharray: 100;
          animation: drawSignal 6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.3s;
        }
        .signal-main {
          stroke-dasharray: 100;
          animation: drawSignal 6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .pulse-ring {
          animation: pulseRingLight 6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
        }
        .float-icon {
          animation: etherealFloat 6s ease-in-out infinite;
        }
      `}</style>

      {/* Icon */}
      <div className="relative flex items-center justify-center mb-8 h-24 w-24">
        <div
          className="absolute w-14 h-14 rounded-full blur-xl animate-pulse"
          style={{ background: "#A8C4C520" }}
        />
        <div
          className="absolute w-16 h-16 rounded-full pulse-ring"
          style={{ border: "1px solid #1F5C5E30" }}
        />
        <div
          className="absolute w-16 h-16 rounded-full pulse-ring"
          style={{ border: "1px solid #1F5C5E20", animationDelay: "1.2s" }}
        />

        <div className="relative z-10 w-14 h-14 float-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="absolute inset-0 w-full h-full signal-ghost"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#A8C4C5" }}
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="absolute inset-0 w-full h-full signal-main"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#1F5C5E" }}
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex items-center gap-2 mb-1.5">
        <Activity size={18} style={{ color: "#1F5C5E" }} />
        <span
          className="text-[18px] font-semibold tracking-wide"
          style={{ color: "var(--color-text-primary)" }}
        >
          Signal{" "}
          <span
            className="font-light"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Preparation
          </span>
        </span>
      </div>
      <p
        className="text-[11px] tracking-widest uppercase"
        style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
      >
        Loading your session
      </p>
    </div>
  );
}
