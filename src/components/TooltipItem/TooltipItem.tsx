import { useState, useRef } from "react";

interface Props {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
  show: boolean;
}

export function TooltipItem({ label, shortcut, children, show }: Props) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!show) return <>{children}</>;

  function handleMouseEnter() {
    timer.current = setTimeout(() => setVisible(true), 500);
  }

  function handleMouseLeave() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {visible && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 flex items-center gap-2 text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          {label}
          {shortcut && (
            <span className="text-[11px] opacity-60 font-normal">
              {shortcut}
            </span>
          )}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: "#1A1A1A" }}
          />
        </div>
      )}
    </div>
  );
}
