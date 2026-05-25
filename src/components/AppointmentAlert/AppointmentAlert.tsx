import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { useNextAppointment } from "../../hooks/useNextAppointment";

export function AppointmentAlert() {
  const next = useNextAppointment();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState<string | null>(null);

  const isPatientDetail = location.pathname.startsWith("/patient/");
  const shouldShow =
    next &&
    next.minutesUntil <= 5 &&
    next.minutesUntil >= -2 &&
    !isPatientDetail &&
    dismissed !== next.id;

  useEffect(() => {
    if (dismissed && next?.id !== dismissed) {
      setDismissed(null);
    }
  }, [next?.id]);

  if (!shouldShow) return null;

  return (
    <div
      className="fixed top-5 right-6 z-50 flex items-center gap-4 px-5 py-3 rounded-xl"
      style={{
        background: "#FFF3CD",
        border: " 1px solid #FFE69C",
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.10), 0 1px 2px -1px rgba(0, 0, 0, 0.10)",
        minWidth: "420px",
        maxWidth: "450px",
      }}
    >
      <Clock size={18} style={{ color: "#FF9500", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: "#856404" }}>
          {next.minutesUntil <= 0
            ? "Consultation starting now"
            : `Next patient in ${next.minutesUntil} minute${next.minutesUntil !== 1 ? "s" : ""}`}
        </p>
        <p className="text-[12px]" style={{ color: "#856404", opacity: 0.9 }}>
          {next.patientName} · {next.time} ·{" "}
          <button
            onClick={() => navigate(`/patient/${next.patientId}`)}
            className="underline underline-offset-2 hover:opacity-70 transition-opacity pl-2"
            style={{ color: "#0050D2" }}
          >
            View patient
          </button>
        </p>
      </div>
      <button
        onClick={() => setDismissed(next.id)}
        className="flex-shrink-0 hover:opacity-60 transition-opacity"
      >
        <X size={15} style={{ color: "#856404" }} />
      </button>
    </div>
  );
}
