import { useNavigate } from "react-router-dom";
import { useSignalEpisode } from "../hooks/useSignalEpisode";
import type { SignalEpisode } from "../hooks/useSignalEpisode";
import { usePatientSummary } from "../hooks/usePatientSummary";
import {
  Clock,
  AlertCircle,
  Loader2,
  User,
  Timer,
  UserCheck,
  XCircle,
  CheckCircle,
  AlertTriangle,
  ImageIcon,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppointments } from "../hooks/useAppointments";
import type { AppointmentRow } from "../hooks/useAppointments";
import {
  startSimulator,
  backfillPastAppointments,
} from "../utils/appointmentSimulator";
import { DateNavigator } from "../components/DateNavigator/DateNavigator";
import type { AgendaMode } from "../components/DateNavigator/DateNavigator";
import { useWeekAppointments } from "../hooks/useWeekAppointments";
import type { DayLoad } from "../hooks/useWeekAppointments";
import { PanelHeader } from "../components/PanelHeader/PanelHeader";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { parseMedicationDisplay } from "../utils/parseMedication";

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> =
  {
    booked: {
      bg: "bg-sp-status-bg-ok",
      fg: "text-sp-status-fg-ok",
      label: "Confirmed",
    },
    arrived: {
      bg: "bg-sp-status-bg-warn",
      fg: "text-sp-status-fg-warn",
      label: "Waiting room",
    },
    fulfilled: {
      bg: "bg-sp-surface",
      fg: "text-sp-text-secondary",
      label: "Fulfilled",
    },
    cancelled: {
      bg: "bg-sp-status-bg-urgent",
      fg: "text-sp-status-fg-urgent",
      label: "Cancelled",
    },
    pending: {
      fg: "text-sp-text-secondary",
      label: "Pending",
    },
    noshow: {
      bg: "bg-sp-status-bg-urgent",
      fg: "text-sp-status-fg-urgent",
      label: "No show",
    },
  };

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Timer,
  arrived: UserCheck,
  noshow: XCircle,
  cancelled: XCircle,
};

function StatusPill({ status, past }: { status: string; past?: boolean }) {
  const Icon = STATUS_ICONS[status] ?? null;

  if (past && status !== "noshow" && status !== "cancelled") {
    return (
      <span className="inline-flex items-center justify-start px-3 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-sp-surface text-sp-text-secondary">
        {STATUS_STYLES[status]?.label ?? status}
      </span>
    );
  }

  const s = STATUS_STYLES[status] ?? {
    bg: "bg-sp-surface",
    fg: "text-sp-text-secondary",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 gap-[4px] rounded text-[10px] font-medium uppercase tracking-wide ${s.bg} ${s.fg}`}
    >
      {s.label}
      {Icon && <Icon size={12} aria-hidden />}
    </span>
  );
}

function EmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-sp-text-secondary">
      <User size={28} className="mb-3 opacity-20" />
      <p className="text-[14px] font-medium">Select a patient</p>
      <p className="text-[12px] mt-1 opacity-60">
        Consultation context will appear here
      </p>
    </div>
  );
}

function buildContextSummary(
  appt: AppointmentRow,
  summary: PatientSummary,
  hasSignal: boolean,
  episode: SignalEpisode | null,
): string {
  const firstName = appt.patientName.split(" ")[0];
  const cleanReason = appt.reason.split("—")[0].trim().toLowerCase();
  const sentences: string[] = [];

  const confirmedConditions = summary.conditions
    .filter((c) => c.verificationStatus === "confirmed")
    .map((c) => c.display);

  // Siempre arranca con el nombre + condiciones o reason
  if (confirmedConditions.length > 0) {
    sentences.push(
      `${firstName} presents with **${confirmedConditions.slice(0, 2).join("** and **")}**`,
    );
  } else {
    sentences.push(`${firstName} presents for ${cleanReason}`);
  }

  // Medicación
  if (summary.medications.length > 0) {
    sentences.push(
      `Currently on **${summary.medications.length}** active medication${summary.medications.length > 1 ? "s" : ""}`,
    );
  }

  // Signal
  if (hasSignal && episode) {
    const changed = episode.deltas
      .filter((d) => d.changed)
      .map((d) => d.label.toLowerCase());
    if (changed.length > 0) {
      const last = changed.pop();
      const changedStr =
        changed.length > 0 ? `${changed.join(", ")} and ${last}` : last;
      sentences.push(
        `Worsening pattern detected — **${changedStr}** changed since first Signal observation`,
      );
    } else {
      sentences.push(
        `Recurring symptom pattern tracked in Signal — no significant change detected`,
      );
    }
  } else if (confirmedConditions.length > 0) {
    // Hay condiciones pero no Signal — agregá el reason como contexto adicional
    sentences.push(`Scheduled for ${cleanReason}`);
  }

  return sentences.join(". ") + ".";
}

function getConsultationSubtitle(appt: AppointmentRow, now: Date): string {
  if (appt.status === "noshow")
    return "Patient did not attend this consultation";
  if (appt.status === "fulfilled") return "";

  if (appt.start) {
    const start = new Date(appt.start);
    const diff = Math.round((start.getTime() - now.getTime()) / 60000);
    if (diff > 0 && diff <= 120) {
      return `Consultation starts in ${diff} min`;
    }
    if (diff <= 0 && diff >= -30) {
      return `Consultation started ${Math.abs(diff)} min ago`;
    }
  }

  const statusLabel: Record<string, string> = {
    booked: "Confirmed",
    pending: "Pending confirmation",
    arrived: "Patient arrived",
    cancelled: "Cancelled",
  };
  return statusLabel[appt.status] ?? appt.status;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function PatientPhotos({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="text-[12px] font-medium text-sp-text-secondary uppercase tracking-wide mb-2">
        Patient attached photos · {photos.length}
      </p>
      <div className="flex gap-2 flex-wrap">
        {photos.map((_, i) => (
          <div
            key={i}
            className="rounded overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 border border-gray-300"
            style={{
              width: "72px",
              height: "72px",
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <ImageIcon size={20} className="text-blue-600 opacity-80" />
              <span className="text-[9px] text-sp-text-secondary opacity-80">
                Photo {i + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentPanel({ appt }: { appt: AppointmentRow }) {
  const navigate = useNavigate();
  const {
    episodes,
    hasSignal,
    loading: signalLoading,
  } = useSignalEpisode(appt.patientId);
  const now = new Date();
  const subtitle = getConsultationSubtitle(appt, now);
  const summary = usePatientSummary(appt.patientId);
  const episode = episodes[0] ?? null;
  const latest = episode?.observations[episode.observations.length - 1] ?? null;
  const { patient } = usePatientDetail(appt.patientId);

  const contextSummary =
    !summary.loading && !signalLoading
      ? buildContextSummary(appt, summary, hasSignal, episode)
      : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader
        title={appt.patientName}
        titleSecondary={
          patient
            ? `${patient.age}y · ${patient.gender === "male" ? "Male" : patient.gender === "female" ? "Female" : patient.gender}`
            : undefined
        }
        subtitle={subtitle || undefined}
        action={{
          label: "View full chart",
          onClick: () =>
            appt.patientId && navigate(`/patient/${appt.patientId}`),
        }}
      />

      <div className="flex-1 overflow-y-auto">
        {/* ── Layer 1 — Context summary ── */}
        {contextSummary && (
          <div className="border-b border-gray-200">
            <div className="px-6 pt-3 pb-2 border-b border-gray-200 bg-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary">
                Consultation context
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[14px] text-sp-text-primary leading-relaxed">
                {contextSummary.split(/\*\*(.+?)\*\*/g).map((part, i) =>
                  i % 2 === 1 ? (
                    <span key={i} className="font-medium text-sp-text-primary">
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Layer 2 — Clinical history (FHIR) ── */}
        <div className="border-b border-gray-200">
          <div className="px-5 py-2 border-b border-gray-200 bg-gray-100 flex gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary">
              Clinical background
            </p>
            {summary.clinicalRecordsDate && (
              <p className="text-[10px] text-sp-text-secondary">
                Last records available · {summary.clinicalRecordsDate}
              </p>
            )}
          </div>

          <div className="px-5 py-4">
            {summary.loading ? (
              <div className="flex items-center gap-2 text-sp-text-secondary">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[12px]">Loading…</span>
              </div>
            ) : summary.conditions.length === 0 &&
              summary.medications.length === 0 ? (
              // Empty state — nada registrado
              <p className="text-[12px] text-sp-text-secondary italic">
                No clinical history recorded — complete during consultation
              </p>
            ) : (
              <div className="space-y-4">
                {/* Conditions — solo si hay */}
                {summary.conditions.length > 0 && (
                  <div className="flex items-stretch gap-3 w-full overflow-x-auto">
                    {summary.conditions.map((c) => (
                      <div
                        key={c.id}
                        className="flex-1 flex flex-col justify-between"
                        style={{
                          minWidth: "140px",
                          background: "#F3F4F6",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px",
                          padding: "10px 10px",
                        }}
                      >
                        <p
                          className="text-[13px] font-medium text-sp-text-primary"
                          style={{ lineHeight: 1.3, wordBreak: "break-word" }}
                        >
                          {c.display}
                        </p>
                        <div>
                          <div className="flex items-center gap-1.5 mt-3">
                            {c.verificationStatus === "confirmed" ? (
                              <CheckCircle
                                size={13}
                                style={{ color: "#0F6E56", flexShrink: 0 }}
                              />
                            ) : (
                              <Clock
                                size={13}
                                style={{ color: "#854F0B", flexShrink: 0 }}
                              />
                            )}
                            <span
                              className="text-[11px] font-medium"
                              style={{
                                color:
                                  c.verificationStatus === "confirmed"
                                    ? "#085041"
                                    : "#633806",
                              }}
                            >
                              {c.verificationStatus === "confirmed"
                                ? "Confirmed"
                                : "Provisional"}
                            </span>
                          </div>
                          {c.recordedDate && (
                            <p
                              style={{
                                fontSize: "10px",
                                color: "var(--color-text-secondary)",
                                marginTop: "3px",
                              }}
                            >
                              First register ·{" "}
                              <span style={{ fontWeight: 500 }}>
                                {c.recordedDate}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medications */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[11px] uppercase tracking-wide text-sp-text-secondary">
                      Active medication
                    </p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: "#E1F5EE", color: "#085041" }}
                    >
                      {summary.medications.length}
                    </span>
                  </div>

                  {summary.medications.length === 0 ? (
                    <p className="text-[12px] text-sp-text-secondary italic">
                      None recorded
                    </p>
                  ) : (
                    <>
                      {summary.polypharmacy.detected && (
                        <div
                          className="flex items-start gap-2 rounded p-2 mb-2"
                          style={{
                            background: "#FCEBEB",
                            border: "0.5px solid #F09595",
                          }}
                        >
                          <AlertTriangle
                            size={12}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: "#A32D2D" }}
                          />
                          <div>
                            <p
                              className="text-[12px] font-medium"
                              style={{ color: "#A32D2D" }}
                            >
                              Polypharmacy
                            </p>
                            <p
                              className="text-[12px] mt-0.5"
                              style={{ color: "#A32D2D", opacity: 0.8 }}
                            >
                              {summary.polypharmacy.reason}
                            </p>
                          </div>
                        </div>
                      )}
                      {summary.medications.slice(0, 5).map((m) => {
                        const parsed = parseMedicationDisplay(m.display);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between py-2"
                            style={{
                              borderBottom:
                                "0.5px solid var(--color-border-tertiary)",
                            }}
                          >
                            <div>
                              <p className="text-[13px] font-medium text-sp-text-primary">
                                {parsed.name}
                              </p>
                              {(parsed.dose || parsed.form) && (
                                <p className="text-[11px] text-sp-text-secondary mt-0.5">
                                  {[parsed.dose, parsed.form]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {summary.medications.length > 5 && (
                        <button
                          onClick={() =>
                            appt.patientId &&
                            navigate(`/patient/${appt.patientId}`)
                          }
                          className="text-[11px] text-sp-primary hover:opacity-70 transition-opacity mt-1"
                        >
                          +{summary.medications.length - 5} more · View full
                          chart →
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Layer 3 — Signal episode ── */}
        {signalLoading ? (
          <div className="flex items-center gap-2 px-5 py-4 text-sp-text-secondary">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-[12px]">Loading Signal data…</span>
          </div>
        ) : hasSignal && episode ? (
          <div>
            <div className="px-5 py-2 border-b border-gray-200 bg-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary">
                Signal episode
              </p>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-start gap-2">
                <p
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide flex-shrink-0"
                  style={{ background: "#FAEEDA", color: "#854F0B" }}
                >
                  {episode.deltas.some((d) => d.changed)
                    ? "Worsening pattern detected"
                    : "No significant change"}
                </p>
                <p className="text-[13px] text-sp-text-primary leading-snug">
                  {episode.deltas.some((d) => d.changed)
                    ? (() => {
                        const changed = episode.deltas
                          .filter((d) => d.changed)
                          .map(
                            (d) =>
                              d.label.charAt(0).toUpperCase() +
                              d.label.slice(1).toLowerCase(),
                          );
                        const last = changed.pop();
                        const text =
                          changed.length > 0
                            ? `${changed.join(", ")} and ${last}`
                            : last;
                        return `${text} changed since the first observation registered by the patient`;
                      })()
                    : "Recurring symptom pattern — no significant change detected"}
                </p>
              </div>
            </div>

            <div className="px-5 py-1">
              {episode.observations.length >= 2 &&
                (() => {
                  const first = episode.observations[0];
                  const latest =
                    episode.observations[episode.observations.length - 1];
                  const firstDate = new Date(first.effectiveDateTime);
                  const latestDate = new Date(latest.effectiveDateTime);
                  const daysDiff = Math.round(
                    (latestDate.getTime() - firstDate.getTime()) / 86400000,
                  );
                  const formatDate = (d: Date) =>
                    d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                  // Tendencia desde intensidad
                  const parseIntensity = (val: string) =>
                    parseFloat(val.split("/")[0]) || 0;
                  const firstIntensity = parseIntensity(
                    first.components.intensity,
                  );
                  const latestIntensity = parseIntensity(
                    latest.components.intensity,
                  );
                  const trend =
                    latestIntensity > firstIntensity
                      ? "worsening"
                      : latestIntensity < firstIntensity
                        ? "improving"
                        : "stable";
                  const trendColor =
                    trend === "worsening"
                      ? "#854F0B"
                      : trend === "improving"
                        ? "#0F6E56"
                        : "#6B7280";
                  const trendBg =
                    trend === "worsening"
                      ? "#FAEEDA"
                      : trend === "improving"
                        ? "#E1F5EE"
                        : "#F3F4F6";

                  return (
                    <div className="mb-4 overflow-hidden rounded border border-gray-300">
                      {/* Trajectory indicator */}
                      <div className="px-3 py-2 border-b border-gray-300 bg-gray-100">
                        <p className="text-[13px] text-gray-600">
                          {formatDate(firstDate)} ·{" "}
                          {episode.observations.length} observation
                          {episode.observations.length > 1 ? "s" : ""} ·{" "}
                          {daysDiff} day{daysDiff !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {/* Table — first vs latest */}
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="px-3 py-2 text-left font-medium text-sp-text-secondary w-24 bg-sp-surface">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-sp-text-secondary ">
                              {formatDate(firstDate)}
                            </th>
                            <th className="w-6 " />
                            <th className="px-3 py-2 text-left font-medium text-sp-text-secondary ">
                              {formatDate(latestDate)}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {episode.deltas
                            .filter((delta) => delta.field !== "since")
                            .map((delta) => (
                              <tr
                                key={delta.field}
                                className="border-b border-gray-300 last:border-b-0"
                                style={
                                  delta.changed
                                    ? { background: "rgba(225,245,238,0.3)" }
                                    : {}
                                }
                              >
                                <td className="px-3 py-2 font-medium text-sp-text-secondary">
                                  {delta.label}
                                </td>
                                <td
                                  className="px-3 py-2"
                                  style={{
                                    color: delta.changed
                                      ? "var(--color-text-primary)"
                                      : "var(--color-text-secondary)",
                                    fontWeight: delta.changed ? 500 : 400,
                                  }}
                                >
                                  {delta.previous}
                                </td>
                                <td
                                  className="py-2 text-center"
                                  style={{ color: "#0F6E56", fontSize: "13px" }}
                                >
                                  {delta.changed ? "→" : ""}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    style={{
                                      color: delta.changed
                                        ? "#0F6E56"
                                        : "var(--color-text-secondary)",
                                      fontWeight: delta.changed ? 500 : 400,
                                    }}
                                  >
                                    {delta.current}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

              {/* Patient voice + photos */}
              <div className="flex flex-col md:flex-row items-start gap-6 mb-4 mt-6">
                {/* Voice / Description */}
                <div className="flex-1 w-full">
                  <h3 className="text-[11px]  text-gray-500 uppercase tracking-wider mb-3">
                    Patient Description
                  </h3>
                  {episode.patientVoice && (
                    <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3">
                      <p className="text-gray-800 text-[15px] leading-relaxed">
                        "{episode.patientVoice}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Photos button */}
                {latest && latest.photos && latest.photos.length > 0 && (
                  <div className="shrink-0 w-full md:w-auto">
                    <h3 className="text-[11px]  text-white uppercase tracking-wider mb-3 ">
                      Attached Photos
                    </h3>
                    <button
                      onClick={() =>
                        latest.photos.forEach(
                          (url, i) => i === 0 && window.open(url, "_blank"),
                        )
                      }
                      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-4 py-3  w-full md:w-max cursor-pointer"
                    >
                      <span className="text-sm text-gray-600 ">
                        {latest.photos.length} Photo
                        {latest.photos.length !== 1 ? "s" : ""}
                      </span>

                      <div className="shrink-0 flex items-center justify-center w-9 h-9 bg-white border border-slate-200 rounded">
                        <ImageIcon
                          size={16}
                          className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                        />
                      </div>

                      <ChevronRight
                        size={16}
                        className="shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors"
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* ICE */}
              {(episode.ice.thinks ||
                episode.ice.worries ||
                episode.ice.expects) && (
                <div className="space-y-2 my-4">
                  {episode.ice.thinks && (
                    <div className="flex gap-3 items-center">
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-sp-text-secondary w-16 flex-shrink-0 ">
                        Thinks
                      </span>
                      <span className="text-[14px] text-sp-text-primary">
                        {episode.ice.thinks}
                      </span>
                    </div>
                  )}
                  {episode.ice.worries && (
                    <div className="flex gap-3 items-center">
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-sp-text-secondary w-16 flex-shrink-0 ">
                        Worries
                      </span>
                      <span className="text-[14px] text-sp-text-primary">
                        {episode.ice.worries}
                      </span>
                    </div>
                  )}
                  {episode.ice.expects && (
                    <div className="flex gap-3 items-center">
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-sp-text-secondary w-16 flex-shrink-0 ">
                        Expects
                      </span>
                      <span className="text-[14px] text-sp-text-primary">
                        {episode.ice.expects}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WeekView({
  days,
  loading,
  currentDate,
  onSelectDay,
}: {
  days: DayLoad[];
  loading: boolean;
  currentDate: Date;
  onSelectDay: (date: Date) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<DayLoad | null>(null);

  useEffect(() => {
    if (days.length === 0) return;
    const currentStr = currentDate.toISOString().split("T")[0];
    const match = days.find((d) => d.dateStr === currentStr);
    setSelectedDay(match ?? days[0]);
  }, [days, currentDate]);

  const today = new Date().toISOString().split("T")[0];
  const maxLoad = Math.max(...days.map((d) => d.total), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sp-text-secondary">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-[14px]">Loading week…</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Barras de carga semanal */}
      <div className="w-[35%] bg-sp-surface rounded-card shadow-card-sm overflow-hidden flex flex-col h-fit">
        <div className="px-4 py-3 border-b border-sp-border flex-shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sp-text-secondary">
            Weekly load
          </p>
        </div>
        <div className="flex-1 flex items-end gap-3 px-4 pb-6 pt-4">
          {days.map((day) => {
            const isSelected = selectedDay?.dateStr === day.dateStr;
            const isToday = day.dateStr === today;
            const heightPct =
              day.total === 0 ? 4 : Math.round((day.total / maxLoad) * 100);

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDay(day)}
                className="flex-1 flex flex-col items-center gap-2 group"
              >
                {/* Label día — arriba */}
                <p
                  className={[
                    "text-[12px] font-medium",
                    isToday && !isSelected
                      ? "text-sp-primary"
                      : isSelected
                        ? "text-sp-primary"
                        : "text-sp-text-secondary",
                  ].join(" ")}
                >
                  {day.label}
                </p>

                {/* Barra — medio */}
                <div
                  className="w-full flex flex-col items-center justify-end"
                  style={{ height: "120px" }}
                >
                  {/* Número fuera si está vacío — arriba */}
                  {day.total === 0 && (
                    <span className="text-[13px] text-sp-primary mb-1">0</span>
                  )}

                  <div
                    className={[
                      "w-full rounded-md transition-all duration-200 flex items-end justify-center pb-2",
                      isSelected
                        ? "bg-sp-primary"
                        : day.total > 0
                          ? "bg-sp-border group-hover:bg-sp-primary-light"
                          : "bg-sp-border group-hover:bg-sp-primary-light",
                    ].join(" ")}
                    style={{
                      height: day.total === 0 ? "8px" : `${heightPct}%`,
                    }}
                  >
                    {/* Número dentro solo si hay pacientes */}
                    {day.total > 0 && (
                      <span
                        className={[
                          "text-[13px] font-semibold",
                          isSelected
                            ? "text-white"
                            : "text-sp-primary group-hover:text-white",
                        ].join(" ")}
                      >
                        {day.total}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel derecho — appointments del día seleccionado */}
      <div className="flex-1 bg-sp-surface rounded-card shadow-card-sm overflow-hidden flex flex-col">
        {selectedDay ? (
          <>
            <PanelHeader
              title={selectedDay.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              subtitle={`${selectedDay.total} ${selectedDay.total !== 1 ? "appointments" : "appointment"}`}
              action={{
                label: "Open day",
                onClick: () => onSelectDay(selectedDay.date),
              }}
            />
            <div className="overflow-y-auto flex-1">
              {selectedDay.appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sp-text-secondary">
                  <Clock size={24} className="mb-2 opacity-20" />
                  <p className="text-[13px]">No appointments</p>
                </div>
              ) : (
                selectedDay.appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="grid grid-cols-[64px_1fr_100px] gap-3 px-4 py-3 border-b border-sp-border last:border-b-0"
                  >
                    <span className="text-[13px] tabular-nums text-sp-text-secondary">
                      {appt.time}
                    </span>
                    <span className="text-[13px] text-sp-text-primary truncate">
                      {appt.patientName}
                    </span>
                    <StatusPill status={appt.status} />
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-sp-text-secondary">
            <User size={28} className="mb-3 opacity-20" />
            <p className="text-[14px] font-medium">Select a day</p>
            <p className="text-[12px] mt-1 opacity-60">
              Appointments will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AgendaPage() {
  const [date, setDate] = useState(getInitialDate);
  const [mode, setMode] = useState<AgendaMode>(getInitialMode);
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [backfilling, setBackfilling] = useState(true);
  const [now, setNow] = useState(new Date());
  const { appointments, loading, error, refetch } = useAppointments(date);
  const { days, loading: weekLoading } = useWeekAppointments(date);

  function handleModeChange(newMode: AgendaMode) {
    setMode(newMode);
    if (newMode === "day") {
      // Si es fin de semana, ir al próximo lunes
      const today = new Date();
      const day = today.getDay();
      if (day === 0 || day === 6) {
        const next = new Date(today);
        next.setDate(today.getDate() + (day === 6 ? 2 : 1));
        setDate(next);
      } else {
        setDate(today);
      }
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (appointments.length === 0) {
      setBackfilling(false); // ← agregá esta línea
      return;
    }
    backfillPastAppointments(appointments, refetch).then(() => {
      setBackfilling(false);
    });
    const stop = startSimulator(appointments, refetch);
    return stop;
  }, [appointments, refetch]);

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-600">
        <AlertCircle size={16} />
        <span className="text-[14px]">{error}</span>
      </div>
    );
  }

  if (backfilling) {
    return (
      <div className="flex items-center justify-center py-20 text-sp-text-secondary">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-[14px]">Loading schedule…</span>
      </div>
    );
  }

  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const isToday = date.toDateString() === new Date().toDateString();

  let markerInserted = false;

  const rows = appointments.reduce<React.ReactNode[]>((acc, appt) => {
    const isPast = appt.start ? new Date(appt.start) < now : false;

    if (!markerInserted && !isPast && isToday) {
      acc.push(
        <div key="now-marker" className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <div className="flex-1 h-px bg-red-500 opacity-40" />
          <span className="text-[12px] font-medium text-red-500 whitespace-nowrap">
            Now · {hh}:{mm}
          </span>
        </div>,
      );
      markerInserted = true;
    }

    acc.push(
      <button
        key={appt.id}
        onClick={() => setSelected(appt)}
        disabled={!appt.patientId}
        className={[
          "grid grid-cols-[72px_1fr_100px] gap-3 px-4 py-3.5 w-full text-left",
          "border-b border-sp-border last:border-b-0 transition-colors duration-150",
          appt.patientId ? "hover:bg-sp-bg cursor-pointer" : "cursor-default",
          selected?.id === appt.id
            ? "bg-sp-bg border-r-4 border-r-sp-primary"
            : "",
        ].join(" ")}
      >
        <span
          className={[
            "flex items-center gap-1 text-[13px] tabular-nums font-medium",
            selected?.id === appt.id
              ? "text-sp-primary"
              : isPast
                ? "text-sp-text-secondary"
                : "text-sp-text-primary",
          ].join(" ")}
        >
          {appt.time}
        </span>
        <span
          className={[
            "text-[14px] truncate",
            selected?.id === appt.id
              ? "text-sp-primary font-medium"
              : isPast
                ? "text-sp-text-secondary"
                : "text-sp-text-primary",
          ].join(" ")}
        >
          {appt.patientName}
        </span>
        <div className="flex items-center">
          <StatusPill status={appt.status} past={isPast} />
        </div>
      </button>,
    );

    return acc;
  }, []);

  if (!markerInserted && isToday) {
    rows.push(
      <div key="now-marker-end">
        <div className="flex items-center gap-2 px-4 py-1.5 border-t border-sp-border">
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <div className="flex-1 h-px bg-red-500 opacity-40" />
          <span className="text-[10px] font-medium text-red-500 whitespace-nowrap">
            Now · {hh}:{mm}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-sp-text-secondary gap-1">
          <Clock size={24} className="opacity-20 mb-1" />
          <p className="text-[13px] font-medium">No more appointments today</p>
          <p className="text-[11px] opacity-60">Schedule resumes tomorrow</p>
        </div>
      </div>,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-[8px]">
        <DateNavigator date={date} mode={mode} onChange={setDate} />
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-sp-bg rounded-lg p-0.5 border border-sp-border">
            {(["day", "week", "month"] as AgendaMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={[
                  "px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-colors",
                  mode === m
                    ? "bg-sp-surface text-sp-primary shadow-sm"
                    : "text-sp-text-secondary hover:text-sp-primary",
                ].join(" ")}
              >
                {m}
              </button>
            ))}
          </div>
          {new Date().getDay() !== 0 && new Date().getDay() !== 6 && (
            <button
              onClick={() => {
                const today = new Date();
                const day = today.getDay();
                if (day === 0 || day === 6) {
                  const next = new Date(today);
                  next.setDate(today.getDate() + (day === 6 ? 2 : 1));
                  setDate(next);
                  setMode("week");
                } else {
                  setDate(today);
                  setMode("day");
                }
              }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-sp-border text-sp-primary hover:border-sp-primary transition-colors h-[36px]"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {mode === "week" ? (
        <WeekView
          days={days}
          loading={weekLoading}
          currentDate={date}
          onSelectDay={(d) => {
            setDate(d);
            setMode("day");
          }}
        />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Lista — 35% */}
          <div className="w-[35%] bg-sp-surface rounded-card shadow-card-sm overflow-hidden flex flex-col border border-gray-200">
            <div className="grid grid-cols-[72px_1fr_100px] gap-3 px-4 py-3 border-b border-gray-300 bg-gray-100 flex-shrink-0">
              {["Time", "Patient", "Status"].map((h) => (
                <span
                  key={h}
                  className="text-[12px] font-medium text-gray-600 tracking-wide"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-sp-text-secondary">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span className="text-[14px]">Loading schedule…</span>
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-sp-text-secondary">
                  <Clock size={32} className="mb-3 opacity-30" />
                  <p className="text-[15px] font-medium">No appointments</p>
                  <p className="text-[13px] mt-1 opacity-70">
                    Schedule is empty
                  </p>
                </div>
              ) : (
                rows
              )}
            </div>

            {appointments.length > 0 && (
              <div className="px-4 py-2.5 border-t border-sp-border flex-shrink-0">
                <p className="text-[11px] text-sp-text-secondary">
                  {appointments.length}{" "}
                  {appointments.length !== 1 ? "appointments" : "appointment"}
                </p>
              </div>
            )}
          </div>

          {/* Panel derecho — 65% */}
          <div className="flex-1 bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
            {selected ? <AppointmentPanel appt={selected} /> : <EmptyPanel />}
          </div>
        </div>
      )}
    </div>
  );
}

function getInitialMode(): AgendaMode {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? "week" : "day";
}

function getInitialDate(): Date {
  const today = new Date();
  const day = today.getDay();
  if (day === 6) {
    // sábado → próximo lunes
    const next = new Date(today);
    next.setDate(today.getDate() + 2);
    return next;
  }
  if (day === 0) {
    // domingo → próximo lunes
    const next = new Date(today);
    next.setDate(today.getDate() + 1);
    return next;
  }
  return today;
}
