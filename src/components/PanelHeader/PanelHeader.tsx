import { ChevronRight } from "lucide-react";

interface PanelHeaderProps {
  title: string;
  titleSecondary?: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const STATUS_STYLES = {
  NOT_ATTENDED: {
    bg: "#FEE2E2",
    text: "#991B1B", // Este se queda igual porque la ausencia SÍ debe competir (es una alerta crítica)
  },
  PENDING: {
    bg: "rgba(242, 211, 109, 0.12)", // Fondo ámbar muy translúcido
    text: "#F2D36D", // Ámbar suave (identidad de pendiente, pero integrado al fondo)
  },
  CONFIRMED: {
    bg: "rgba(110, 231, 183, 0.12)", // Verde translúcido sutil
    text: "#6EE7B7", // Verde menta suave
  },
} as const;

function getSubtitleStyle(subtitle: string): { bg: string; text: string } {
  // Aseguramos que las comparaciones no fallen por mayúsculas/minúsculas
  const normalizedSubtitle = subtitle.toLowerCase();

  if (normalizedSubtitle.includes("did not attend")) {
    return STATUS_STYLES.NOT_ATTENDED;
  }

  if (normalizedSubtitle.includes("pending")) {
    return STATUS_STYLES.PENDING;
  }

  // Estado por defecto (Confirmed)
  return STATUS_STYLES.CONFIRMED;
}

export function PanelHeader({
  title,
  titleSecondary,
  subtitle,
  action,
}: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 flex-shrink-0"
      style={{ backgroundColor: "#1F5C5E" }}
    >
      <div>
        <p className="text-[16px] font-medium text-white">{title}</p>
        {titleSecondary && (
          <p className="text-[15px] -mt-0.5 text-white">{titleSecondary}</p>
        )}
        {subtitle && (
          <p className="mt-2">
            {(() => {
              const s = getSubtitleStyle(subtitle);
              return (
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded"
                  style={{ background: s.bg, color: s.text }}
                >
                  {subtitle}
                </span>
              );
            })()}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[14px] font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {action.label}{" "}
          <ChevronRight size={18} strokeWidth={2.5} className="ml-1" />
        </button>
      )}
    </div>
  );
}
