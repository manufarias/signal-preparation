import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Calendar,
  Search,
  Plus,
  User,
  X,
  ArrowRight,
} from "lucide-react";
import usePatients from "../../hooks/usePatients";
import { useDebounce } from "../../hooks/useDebounce";
import { PatientDrawer } from "../PatientDrawer/PatientDrawer";

type Mode = "commands" | "search";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("commands");
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 300);
  const { patients } = usePatients(mode === "search" ? debouncedSearch : "");

  function close() {
    setOpen(false);
    setSearch("");
    setMode("commands");
    setSelectedIndex(0);
  }

  function go(path: string) {
    navigate(path);
    close();
  }

  function openDrawer() {
    close();
    setTimeout(() => setDrawerOpen(true), 150);
  }

  const commands: CommandItem[] = [
    {
      id: "today",
      label: "Today's schedule",
      icon: CalendarDays,
      action: () => go("/"),
      action: () => {
        go("/");
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("set-agenda-mode", { detail: "day" }),
          );
        }, 100);
      },
    },
    {
      id: "week",
      label: "This week",
      icon: Calendar,
      action: () => {
        go("/");
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("set-agenda-mode", { detail: "week" }),
          );
        }, 100);
      },
    },
    {
      id: "month",
      label: "This month",
      icon: Calendar,
      action: () => {
        go("/");
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("set-agenda-mode", { detail: "month" }),
          );
        }, 100);
      },
    },
    {
      id: "search",
      label: "Search patient",
      icon: Search,
      action: () => {
        setMode("search");
        setSelectedIndex(0);
      },
    },
    { id: "new", label: "New patient", icon: Plus, action: openDrawer },
    {
      id: "browse",
      label: "See all patients",
      icon: User,
      action: () => go("/patients"),
    },
  ];

  const commandGroups = [
    { heading: "Schedule", items: commands.slice(0, 3) },
    { heading: "Patients", items: commands.slice(3) },
  ];

  const filteredCommands = commands.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "search") {
          setMode("commands");
          setSearch("");
          setSelectedIndex(0);
        } else {
          close();
        }
        return;
      }
      if (mode === "commands") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex(
            (i) => (i + 1) % Math.max(filteredCommands.length, 1),
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (i) =>
              (i - 1 + Math.max(filteredCommands.length, 1)) %
              Math.max(filteredCommands.length, 1),
          );
        }
        if (e.key === "Enter") {
          e.preventDefault();
          filteredCommands[selectedIndex]?.action();
        }
      }
      if (mode === "search") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(patients.length, 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (i) =>
              (i - 1 + Math.max(patients.length, 1)) %
              Math.max(patients.length, 1),
          );
        }
        if (e.key === "Enter" && patients[selectedIndex]) {
          e.preventDefault();
          go(`/patient/${patients[selectedIndex].id}`);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, mode, selectedIndex, filteredCommands, patients]);

  if (!open)
    return (
      <PatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => setDrawerOpen(false)}
      />
    );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
        style={{ background: "rgba(0,0,0,0.25)" }}
        onClick={close}
      >
        <div
          className="w-full max-w-lg bg-white rounded-2xl overflow-hidden flex flex-col"
          style={{
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input */}
          <div
            className="flex items-center px-4 py-4"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <Search
              size={18}
              className="mr-3 flex-shrink-0"
              style={{ color: "#94a3b8" }}
            />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: "16px", color: "#1e293b" }}
              placeholder={
                mode === "commands" ? "Go to..." : "Search by name..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
            />
            <button onClick={close} style={{ color: "#94a3b8" }}>
              <X size={18} />
            </button>
          </div>

          {/* List */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "60vh", padding: "8px" }}
          >
            {mode === "commands" && (
              <>
                {commandGroups.map((group, gi) => {
                  const filteredItems = group.items.filter((item) =>
                    item.label.toLowerCase().includes(search.toLowerCase()),
                  );
                  if (filteredItems.length === 0) return null;
                  return (
                    <div key={group.heading} className={gi > 0 ? "mt-1" : ""}>
                      {gi > 0 && (
                        <div
                          style={{
                            height: "1px",
                            background: "#e2e8f0",
                            margin: "6px 4px",
                          }}
                        />
                      )}
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#64748b",
                          padding: "8px 12px 4px",
                        }}
                      >
                        {group.heading}
                      </p>
                      {filteredItems.map((item) => {
                        const filteredIdx = filteredCommands.findIndex(
                          (c) => c.id === item.id,
                        );
                        const isSelected = filteredIdx === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            className="w-full flex items-center text-left"
                            style={{
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: isSelected
                                ? "#e6f4f1"
                                : "transparent",
                              color: isSelected ? "#1b4d4d" : "#334155",
                              fontWeight: isSelected ? 500 : 400,
                              fontSize: "14px",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={() => setSelectedIndex(filteredIdx)}
                            onClick={item.action}
                          >
                            <Icon
                              size={16}
                              className="mr-3 flex-shrink-0"
                              style={{
                                color: isSelected ? "#1b4d4d" : "#94a3b8",
                              }}
                            />
                            {item.label}
                            {isSelected && (
                              <span
                                className="ml-auto"
                                style={{
                                  fontSize: "10px",
                                  color: "#1b4d4d",
                                  opacity: 0.6,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  fontWeight: 600,
                                }}
                              >
                                Enter
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {filteredCommands.length === 0 && (
                  <p
                    style={{
                      padding: "16px 12px",
                      fontSize: "13px",
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    No commands found
                  </p>
                )}
              </>
            )}

            {mode === "search" && (
              <>
                {patients.length === 0 && search && (
                  <p
                    style={{
                      padding: "16px 12px",
                      fontSize: "13px",
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    No patients found
                  </p>
                )}
                {patients.map((p, i) => {
                  const isSelected = i === selectedIndex;
                  const age =
                    new Date().getFullYear() -
                    new Date(p.birthDate).getFullYear();
                  const gender =
                    p.gender === "male"
                      ? "M"
                      : p.gender === "female"
                        ? "F"
                        : p.gender;
                  return (
                    <button
                      key={p.id}
                      className="w-full flex items-center text-left"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: isSelected ? "#e6f4f1" : "transparent",
                        color: isSelected ? "#1b4d4d" : "#334155",
                        fontSize: "14px",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => go(`/patient/${p.id}`)}
                    >
                      <User
                        size={16}
                        className="mr-3 flex-shrink-0"
                        style={{ color: isSelected ? "#1b4d4d" : "#94a3b8" }}
                      />
                      <span style={{ fontWeight: isSelected ? 500 : 400 }}>
                        {p.name[0].given[0]} {p.name[0].family}
                      </span>
                      <span
                        className="ml-2"
                        style={{ fontSize: "12px", color: "#94a3b8" }}
                      >
                        {age}y · {gender}
                      </span>
                      {isSelected && (
                        <ArrowRight
                          size={14}
                          className="ml-auto"
                          style={{ color: "#1b4d4d", opacity: 0.6 }}
                        />
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              Use{" "}
              <kbd
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "1px 5px",
                  fontSize: "10px",
                  color: "#64748b",
                }}
              >
                ↑
              </kbd>{" "}
              <kbd
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "1px 5px",
                  fontSize: "10px",
                  color: "#64748b",
                }}
              >
                ↓
              </kbd>{" "}
              to navigate
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              <kbd
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "1px 5px",
                  fontSize: "10px",
                  color: "#64748b",
                }}
              >
                Esc
              </kbd>{" "}
              {mode === "search" ? "to go back" : "to close"}
            </span>
          </div>
        </div>
      </div>

      <PatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => setDrawerOpen(false)}
      />
    </>
  );
}
