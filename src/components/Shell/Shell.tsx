import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { CommandPalette } from "../CommandPalette/CommandPalette";
import { TooltipItem } from "../TooltipItem/TooltipItem";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { usePageTitle } from "../../context/PageTitleContext";
import { AppointmentAlert } from "../AppointmentAlert/AppointmentAlert";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useKeyboardShortcuts([
    { key: "b", ctrl: true, action: () => setCollapsed((c) => !c) },
  ]);

  useEffect(() => {
    const base = "Signal Preparation";
    if (pageTitle) {
      document.title = `${pageTitle.split("·")[0].trim()} · ${base}`;
    } else if (location.pathname === "/") {
      document.title = `Schedule · ${base}`;
    } else if (location.pathname === "/patients") {
      document.title = `Patients · ${base}`;
    } else {
      document.title = base;
    }
  }, [pageTitle, location.pathname]);

  useEffect(() => {
    const handler = () => setNetworkError(true);
    const clearHandler = () => setNetworkError(false);
    window.addEventListener("fhir-network-error", handler);
    return () => window.removeEventListener("fhir-network-error", handler);
  }, []);

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
              className="w-7 h-7 rounded-md bg-sp-primary flex items-center justify-center"
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
        className="flex-1 bg-sp-bg rounded-shell mt-[24px] mr-[24px] mb-[24px] overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 48px)" }}
      >
        <AppointmentAlert />

        {networkError && (
          <div
            className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0"
            style={{ background: "#FCEBEB", borderBottom: "1px solid #F5C6C6" }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#A32D2D" }}
            />
            <p className="text-[12px] text-sp-text-primary flex-1">
              <span className="font-medium" style={{ color: "#A32D2D" }}>
                FHIR server unavailable
              </span>
              {" · "}Clinical data cannot be loaded. Please try again in a few
              minutes.
            </p>
            <button
              onClick={() => {
                setNetworkError(false);
                window.location.reload();
              }}
              className="text-[11px] font-medium hover:opacity-70 transition-opacity"
              style={{ color: "#A32D2D" }}
            >
              Retry
            </button>
          </div>
        )}

        <div
          className={`flex-1 flex flex-col relative ${
            location.pathname.startsWith("/patient/")
              ? "overflow-y-auto"
              : "overflow-hidden"
          }`}
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 5)}
        >
          <div
            className={`sticky top-0 z-20 flex items-center justify-between px-8 pt-7 pb-4 transition-all duration-300 flex-shrink-0 ${
              isScrolled && location.pathname.startsWith("/patient/")
                ? "bg-sp-bg/70 backdrop-blur-md shadow-sm border-b border-gray-200/50"
                : "bg-transparent border-b border-transparent"
            }`}
          >
            {location.pathname.startsWith("/patient/") &&
            autoTitle.includes("·") ? (
              <div className="flex items-baseline gap-3">
                <h1 className="text-[20px] font-semibold text-sp-text-primary tracking-tight leading-none">
                  {autoTitle.split("·")[0].trim()}
                </h1>
                <span className="text-[16px] font-mono text-sp-text-secondary opacity-70">
                  {autoTitle.split("·").slice(1).join("·").trim()}
                </span>
              </div>
            ) : (
              <h1
                className={
                  config.level === 1
                    ? "text-[24px] font-medium tracking-tight text-sp-text-primary leading-none transition-colors"
                    : "text-[12px] font-semibold uppercase tracking-widest text-sp-text-secondary leading-none transition-colors"
                }
              >
                {autoTitle}
              </h1>
            )}

            {location.pathname.startsWith("/patient/") && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-consultation-drawer"),
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={{ background: "#1F5C5E", color: "white" }}
                >
                  <Plus size={13} /> Record consultation
                  <span
                    className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    Ctrl+N
                  </span>
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#1F5C5E] transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              </div>
            )}
          </div>

          <div className="px-8 pb-8 flex-1">{children}</div>
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
