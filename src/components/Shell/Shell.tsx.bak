import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { CommandPalette } from "../CommandPalette/CommandPalette";
import { TooltipItem } from "../TooltipItem/TooltipItem";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { usePageTitle } from "../../context/PageTitleContext";

const NAV = [
  { to: "/", label: "Schedule", icon: CalendarDays },
  { to: "/patients", label: "Patients", icon: User },
];

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { pageTitle } = usePageTitle();

  useKeyboardShortcuts([
    { key: "b", ctrl: true, action: () => setCollapsed((c) => !c) },
  ]);

  const TITLE_CONFIG: Record<string, { label: string; level: 1 | 2 }> = {
    "/": { label: "Schedule", level: 2 },
    "/patients": { label: "Patients", level: 1 },
  };

  const config = TITLE_CONFIG[location.pathname] ?? {
    label: "Patient record",
    level: 1,
  };
  const autoTitle = pageTitle ?? config.label;

  function openCommandPalette() {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sp-surface">
      {/* ── Sidebar ── */}
      <aside
        className={[
          "flex flex-col h-full bg-sp-surface transition-all duration-300 ease-in-out flex-shrink-0",
          collapsed ? "w-[72px]" : "w-[248px]",
        ].join(" ")}
      >
        {/* Logo */}
        <div
          className={[
            "flex items-center h-[72px] px-5 mb-2 transition-all duration-300",
            collapsed ? "justify-center px-3" : "",
          ].join(" ")}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-7 h-7 rounded-md bg-sp-primary flex items-center justify-center "
            >
              <Activity size={14} className="text-white" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sp-primary flex items-center justify-center flex-shrink-0">
                <Activity size={14} className="text-white" />
              </div>
              <span className="text-[15px] font-semibold text-sp-primary tracking-tight">
                Signal
              </span>
              <span className="text-[15px] font-normal text-sp-text-secondary tracking-tight">
                Prep
              </span>
            </div>
          )}
        </div>

        {/* Command palette trigger */}
        <div className="px-3 mb-8">
          <TooltipItem label="Go to..." shortcut="Ctrl+K" show={collapsed}>
            <button
              onClick={openCommandPalette}
              className={[
                "flex items-center w-full rounded-lg overflow-hidden",
                "text-sp-text-secondary hover:text-sp-primary",
                "transition-colors duration-150 group",
                collapsed
                  ? "justify-center px-3 py-2.5 hover:bg-sp-bg"
                  : "gap-2 px-3 py-2 border border-sp-border bg-sp-bg hover:border-sp-primary",
              ].join(" ")}
              // title="Buscar o navegar (Ctrl+K)"
            >
              <Search size={15} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-[13px] flex-1 text-left whitespace-nowrap">
                    Go to...
                  </span>
                  <span className="text-[11px] font-medium bg-sp-surface px-1.5 py-0.5 rounded border border-sp-border group-hover:border-sp-primary transition-colors">
                    Ctrl+K
                  </span>
                </>
              )}
            </button>
          </TooltipItem>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <TooltipItem key={to} label={label} show={collapsed}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg transition-all duration-150",
                    collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                    isActive
                      ? "bg-sp-bg text-sp-primary font-medium"
                      : "text-sp-text-secondary hover:text-sp-primary",
                  ].join(" ")
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="text-[14px] leading-none">{label}</span>
                )}
              </NavLink>
            </TooltipItem>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-6">
          <TooltipItem
            key={`collapse-${collapsed}`}
            label="Collapse"
            shortcut="Ctrl+B"
            show={collapsed}
          >
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={[
                "flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sp-text-secondary",
                "hover:bg-sp-bg hover:text-sp-primary transition-colors duration-150",
                collapsed ? "justify-center" : "",
              ].join(" ")}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <>
                  <ChevronLeft size={16} />
                  <span className="text-[13px]">Collapse</span>
                  <span className="ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded border border-[#e5e5e5] text-[#999]">
                    Ctrl+B
                  </span>
                </>
              )}
            </button>
          </TooltipItem>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <main
        className="flex-1 bg-sp-bg rounded-shell mt-[24px] mr-[24px] mb-[24px] overflow-hidden"
        style={{ height: "calc(100vh - 48px)" }}
      >
        {/* Page header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <h1
            className={
              config.level === 1
                ? "text-[24px] font-medium tracking-tight text-sp-text-primary leading-none"
                : "text-[12px] font-semibold uppercase tracking-widest text-sp-text-secondary text-sp-text-primaryleading-none"
            }
          >
            {autoTitle}
          </h1>
          {location.pathname.startsWith("/patient/") && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-[13px] text-sp-text-secondary hover:text-sp-primary transition-colors"
            >
              <X size={14} />
              Close chart
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-8 pb-8 h-full overflow-y-auto">{children}</div>
      </main>

      <CommandPalette />
    </div>
  );
}
