import { ChevronLeft, ChevronRight } from "lucide-react";

export type AgendaMode = "day" | "week" | "month";

interface Props {
  date: Date;
  mode: AgendaMode;
  onChange: (date: Date) => void;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

export function DateNavigator({ date, mode, onChange }: Props) {
  const today = new Date();

  function go(direction: number) {
    const next = new Date(date);
    if (mode === "day") {
      next.setDate(next.getDate() + direction);
      // Saltar fines de semana
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + direction);
      }
    }
    if (mode === "week") {
      const monday = getMonday(date);
      monday.setDate(monday.getDate() + direction * 7);
      onChange(monday);
      return;
    }
    if (mode === "month") next.setMonth(next.getMonth() + direction);
    onChange(next);
  }

  function isCurrentPeriod(): boolean {
    if (mode === "day") return date.toDateString() === today.toDateString();
    if (mode === "week") {
      return getMonday(date).toDateString() === getMonday(today).toDateString();
    }
    if (mode === "month") {
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    }
    return false;
  }

  function getLabel(): string {
    if (mode === "day") {
      const label = date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      return date.toDateString() === today.toDateString()
        ? `Today, ${label}`
        : label;
    }
    if (mode === "week") {
      const monday = getMonday(date);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const from = monday.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const to = sunday.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `Week of ${from} – ${to}`;
    }
    if (mode === "month") {
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return "";
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[17px] text-sp-text-secondary capitalize min-w-[200px]">
        {getLabel()}
      </span>

      <button
        onClick={() => go(-1)}
        className="p-1.5 rounded-lg hover:bg-sp-bg text-sp-text-secondary hover:text-sp-primary transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={() => go(1)}
        className="p-1.5 rounded-lg hover:bg-sp-bg text-sp-text-secondary hover:text-sp-primary transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
