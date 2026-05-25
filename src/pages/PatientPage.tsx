import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  Plus,
  Activity,
  Copy,
  Check,
  ImageIcon,
} from "lucide-react";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { useTodayAppointment } from "../hooks/useTodayAppointment";
import type { VitalSeries } from "../hooks/usePatientDetail";
import type { ConsultationNote } from "../hooks/useConsultations";
import { useSignalEpisode } from "../hooks/useSignalEpisode";
import { usePatientSummary } from "../hooks/usePatientSummary";
import { PatientDrawer } from "../components/PatientDrawer/PatientDrawer";
import { usePageTitle } from "../context/PageTitleContext";
import { parseMedicationDisplay } from "../utils/parseMedication";
import { coverageStyle } from "../utils/coverageStyle";
import { useCoverage } from "../hooks/useCoverage";
import { VitalDrawer } from "../components/VitalDrawer/VitalDrawer";
import { ConsultationDrawer } from "../components/ConsultationDrawer/ConsultationDrawer";
import { useConsultations } from "../hooks/useConsultations";
import { PhotoDrawer } from "../components/PhotoDrawer/PhotoDrawer";
import { ConditionDrawer } from "../components/ConditionDrawer/ConditionDrawer";
import { MedicationDrawer } from "../components/MedicationDrawer/MedicationDrawer";
import { VitalSignDrawer } from "../components/VitalSignDrawer/VitalSignDrawer";

// ── Section label ──────────────────────────────────────────────────────
function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-2 border-b border-gray-200 bg-gray-100 flex items-center justify-between">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary">
        {children}
      </p>
      {action}
    </div>
  );
}

// ── Vital card ─────────────────────────────────────────────────────────
function VitalCard({
  label,
  value,
  unit,
  trend,
  history,
}: {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
  history: { value: number }[];
}) {
  const max = Math.max(...history.map((h) => h.value), 1);
  const trendColor =
    trend === "up" ? "#A32D2D" : trend === "down" ? "#0F6E56" : "#6B7280";
  const trendLabel =
    trend === "up"
      ? "↑ Increasing"
      : trend === "down"
        ? "↓ Decreasing"
        : "→ Stable";

  return (
    <div
      className="bg-gray-50 rounded-lg p-3"
      style={{ border: "0.5px solid #E5E7EB" }}
    >
      <p className="text-[11px] text-sp-text-secondary mb-1">{label}</p>
      <p className="text-[18px] font-medium text-sp-text-primary">
        {value}
        <span className="text-[10px] text-sp-text-secondary font-normal ml-1">
          {unit}
        </span>
      </p>
      {history.length > 1 && (
        <div className="flex items-end gap-0.5 mt-2" style={{ height: "20px" }}>
          {history.slice(-5).map((h, i, arr) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${Math.round((h.value / max) * 100)}%`,
                background: i === arr.length - 1 ? "#1F5C5E" : "#A8C4C5",
              }}
            />
          ))}
        </div>
      )}
      <p className="text-[10px] mt-1" style={{ color: trendColor }}>
        {trendLabel}
      </p>
    </div>
  );
}

// ── Folder tabs ────────────────────────────────────────────────────────
function FolderTabs({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className="px-4 py-2.5 text-[12px] font-medium transition-colors"
          style={{
            color: activeTab === tab.id ? "#1F5C5E" : "#6B7280",
            borderBottom:
              activeTab === tab.id
                ? "2px solid #1F5C5E"
                : "2px solid transparent",
            marginBottom: "-0.5px",
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#E1F5EE", color: "#085041" }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// -- Parse conditions

function parseConditionDisplay(display: string): {
  name: string;
  type: string | null;
} {
  const match = display.match(/^(.+?)\s+\(([^)]+)\)$/);
  if (match) return { name: match[1].trim(), type: match[2].trim() };
  return { name: display, type: null };
}

// -- Formatting Vitals
function formatVitalDate(dateStr: string): {
  label: string;
  stale: boolean;
  tooOld: boolean;
} {
  if (!dateStr) return { label: "Unknown date", stale: false, tooOld: false };
  const date = new Date(dateStr);
  if (isNaN(date.getTime()))
    return { label: dateStr, stale: false, tooOld: false };
  const now = new Date();
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());
  if (months >= 24)
    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      stale: true,
      tooOld: true,
    };
  if (months >= 3)
    return {
      label: `${months} month${months !== 1 ? "s" : ""} ago`,
      stale: true,
      tooOld: false,
    };
  return {
    label: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    stale: false,
    tooOld: false,
  };
}

// -- Lab names

function cleanLabName(display: string): string {
  return display.split("[")[0].split("(")[0].trim();
}

//--Scores name
function cleanScoreName(display: string): string {
  // "Total score [AUDIT-C]" → "AUDIT-C"
  const bracket = display.match(/\[([^\]]+)\]/);
  if (bracket) return bracket[1];
  // "Patient Health Questionnaire 2 item (PHQ-2)..." → "PHQ-2"
  const paren = display.match(/\(([^)]+)\)/);
  if (paren) return paren[1];
  return display.split("[")[0].trim();
}

// ── Main page ──────────────────────────────────────────────────────────
export function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    patient,
    observations,
    vitalSeries,
    conditions,
    medications,
    loading,
    error,
  } = usePatientDetail(id);
  const { episodes, hasSignal, loading: signalLoading } = useSignalEpisode(id);
  const coverage = useCoverage(patient?.id);
  const episode = episodes[0] ?? null;
  const latest = episode?.observations[episode.observations.length - 1] ?? null;

  const [vitalDrawer, setVitalDrawer] = useState<VitalSeries | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vitals");
  const [historyOpen, setHistoryOpen] = useState(false);
  const { setPageTitle } = usePageTitle();
  const [copied, setCopied] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  const foldersRef = useRef<HTMLDivElement>(null);
  const [conditionFilter, setConditionFilter] = useState<
    "all" | "active" | "resolved"
  >("all");
  const [medicationFilter, setMedicationFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [conditionTypeFilter, setConditionTypeFilter] = useState<string | null>(
    null,
  );
  const [observationFilter, setObservationFilter] = useState<
    "all" | "vitals" | "labs" | "scores" | "social"
  >("all");
  const [labFilter, setLabFilter] = useState<"30" | "60" | "all">("30");
  const [labSearch, setLabSearch] = useState("");
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const scoreRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [consultationDrawerOpen, setConsultationDrawerOpen] = useState(false);
  const [expandedConsultation, setExpandedConsultation] = useState<
    string | null
  >(null);
  const {
    consultations,
    loading: consultationsLoading,
    refetch: refetchConsultations,
  } = useConsultations(id);
  const [amendingNote, setAmendingNote] = useState<ConsultationNote | null>(
    null,
  );
  const [photoDrawerOpen, setPhotoDrawerOpen] = useState(false);
  const [conditionDrawerOpen, setConditionDrawerOpen] = useState(false);
  const [medicationDrawerOpen, setMedicationDrawerOpen] = useState(false);
  const [vitalSignDrawerOpen, setVitalSignDrawerOpen] = useState(false);
  const { appointment: todayAppointment } = useTodayAppointment(id);
  const summary = usePatientSummary(id ?? null, patient?.age);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);

  function copyAffiliationId() {
    if (!coverage.affiliationId) return;
    navigator.clipboard.writeText(coverage.affiliationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (!patient) return;
    const gender =
      patient.gender === "male" ? "M" : patient.gender === "female" ? "F" : "";
    const stickyTitle = `${patient.name} · ${patient.age}y · ${gender}`;

    setPageTitle(stickyTitle);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPageTitle(entry.isIntersecting ? stickyTitle : stickyTitle);
      },
      { threshold: 0 },
    );
    if (demoRef.current) observer.observe(demoRef.current);
    return () => {
      observer.disconnect();
      setPageTitle(undefined);
    };
  }, [patient]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        setConsultationDrawerOpen(true);
      }
    };
    const drawerHandler = () => setConsultationDrawerOpen(true);

    window.addEventListener("keydown", handler);
    window.addEventListener("open-consultation-drawer", drawerHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-consultation-drawer", drawerHandler);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sp-text-secondary">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-[14px]">Loading chart…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-600">
        <AlertCircle size={16} />
        <span className="text-[14px]">{error}</span>
      </div>
    );
  }

  if (!patient) return null;

  const coverage2 = coverage;
  const activeConditions = conditions.filter((c) => c.status === "active");
  const activeMeds = medications.filter((m) => m.status === "active");
  const hasHistory =
    activeConditions.length > 0 ||
    activeMeds.length > 0 ||
    observations.length > 0;

  const tabs = [
    { id: "vitals", label: "Measurements", count: vitalSeries.length },
    { id: "conditions", label: "Conditions", count: conditions.length },
    { id: "medication", label: "Medication", count: medications.length },
    {
      id: "labs",
      label: "Labs",
      count: observations.filter((o) => o.category === "labs").length,
    },
    {
      id: "scores",
      label: "Scores",
      count: observations.filter((o) => o.category === "scores").length,
    },
    { id: "consultations", label: "Consultations" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-5 flex flex-col gap-4">
      {/* ── Identity + coverage ── */}
      <div
        ref={demoRef}
        className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden"
      >
        <SectionLabel
          action={
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-[11px] text-sp-primary hover:opacity-70 transition-opacity underline"
            >
              Edit data
            </button>
          }
        >
          Identity & coverage
        </SectionLabel>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-[13px]">
                <span className="text-sp-text-secondary">Full name</span>
                <span className="font-medium text-sp-text-primary">
                  {patient.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-[13px]">
                <span className="text-sp-text-secondary">Sex</span>
                <span className="font-medium text-sp-text-primary">
                  {patient.gender === "male"
                    ? "Male"
                    : patient.gender === "female"
                      ? "Female"
                      : patient.gender}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-[13px]">
                <span className="text-sp-text-secondary">Age</span>
                <span className="font-medium text-sp-text-primary">
                  {patient.age} years old
                </span>
              </div>
              <div className="flex justify-between py-2 text-[13px]">
                <span className="text-sp-text-secondary">Date of birth</span>
                <span className="font-medium text-sp-text-primary">
                  {new Date(patient.birthDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div
              style={{ borderLeft: "0.5px solid #F3F4F6", paddingLeft: "32px" }}
            >
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-[13px]">
                <span className="text-sp-text-secondary">Health insurance</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={coverageStyle(coverage.insurance.status)}
                >
                  {coverage.insurance.label}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-[13px]">
                <span className="text-sp-text-secondary">Chronic registry</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={coverageStyle(coverage.chronicRegistry.status)}
                >
                  {coverage.chronicRegistry.label}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-[13px]">
                <span className="text-sp-text-secondary">Affiliation ID</span>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      color: coverage.affiliationId
                        ? "var(--color-text-primary)"
                        : "#9CA3AF",
                      fontStyle: coverage.affiliationId ? "normal" : "italic",
                    }}
                  >
                    {coverage.affiliationId ?? "Not recorded"}
                  </span>
                  {coverage.affiliationId && (
                    <button
                      onClick={copyAffiliationId}
                      className="transition-colors"
                      style={{ color: copied ? "#0F6E56" : "#9CA3AF" }}
                      aria-label="Copy affiliation ID"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Consultation context ── */}
      {todayAppointment && patient && (
        <div className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
          <SectionLabel>Consultation context · Today</SectionLabel>
          <div className="px-6 py-4">
            {/* Appointment data */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] font-medium text-sp-text-primary">
                {todayAppointment.time}
              </span>
              <span className="text-sp-text-secondary text-[13px]">·</span>
              <span className="text-[13px] text-sp-text-secondary">
                Ambulatory
              </span>
              <span className="text-sp-text-secondary text-[13px]">·</span>
              <span className="text-[13px] text-sp-text-secondary">
                {todayAppointment.reason}
              </span>
              <span
                className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded"
                style={{ background: "#E1F5EE", color: "#085041" }}
              >
                {todayAppointment.status}
              </span>
            </div>

            {/* Clinical summary */}
            {!summary.loading &&
              (summary.conditions.length > 0 ||
                summary.medications.length > 0) && (
                <div
                  className="px-4 py-3 rounded-lg text-[13px] text-sp-text-primary leading-relaxed"
                  style={{
                    background: "var(--color-background-secondary)",
                    border: "0.5px solid #E5E7EB",
                  }}
                >
                  {(() => {
                    const firstName = patient.name.split(" ")[0];
                    const sentences: string[] = [];
                    const confirmed = summary.conditions
                      .filter((c) => c.verificationStatus === "confirmed")
                      .map((c) => c.display);

                    if (confirmed.length > 0) {
                      sentences.push(
                        `${firstName} presents with ${confirmed.slice(0, 2).join(" and ")}`,
                      );
                    }
                    if (summary.medications.length > 0) {
                      sentences.push(
                        `Currently on ${summary.medications.length} active medication${summary.medications.length > 1 ? "s" : ""}`,
                      );
                    }
                    return sentences.join(". ") + ".";
                  })()}
                </div>
              )}

            {/* Polypharmacy alert */}
            {summary.polypharmacy.detected && (
              <div
                className="mt-2 px-3 py-2 rounded-lg text-[12px]"
                style={{
                  background: "#FAEEDA",
                  border: "0.5px solid #F5CBA7",
                  color: "#854F0B",
                }}
              >
                ⚠ {summary.polypharmacy.reason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Signal episode ── */}
      {!signalLoading && hasSignal && episode && (
        <div className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
          <SectionLabel>Signal episode</SectionLabel>
          <div className="px-6 py-4">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide mb-3"
              style={{ background: "#FAEEDA", color: "#854F0B" }}
            >
              <AlertTriangle size={11} />
              Worsening pattern detected
            </div>
            <p className="text-[14px] text-sp-text-primary leading-relaxed mb-3">
              {episode.deltas
                .filter((d) => d.changed)
                .map(
                  (d) =>
                    d.label.charAt(0).toUpperCase() +
                    d.label.slice(1).toLowerCase(),
                )
                .reduce(
                  (acc, val, i, arr) =>
                    i === arr.length - 1 && arr.length > 1
                      ? `${acc} and ${val}`
                      : i === 0
                        ? val
                        : `${acc}, ${val}`,
                  "",
                )}{" "}
              changed since the first observation registered by the patient
            </p>
            {episode.observations.length >= 2 &&
              (() => {
                const first = episode.observations[0];
                const last =
                  episode.observations[episode.observations.length - 1];
                const firstDate = new Date(first.effectiveDateTime);
                const lastDate = new Date(last.effectiveDateTime);
                const daysDiff = Math.round(
                  (lastDate.getTime() - firstDate.getTime()) / 86400000,
                );
                const formatD = (d: Date) =>
                  d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                return (
                  <div
                    className="rounded-lg p-3 mb-3"
                    style={{
                      background: "var(--color-background-secondary)",
                      border: "0.5px solid #E5E7EB",
                    }}
                  >
                    <p className="text-[11px] text-sp-text-secondary mb-2">
                      {formatD(firstDate)} · {episode.observations.length}{" "}
                      observations · {daysDiff} days
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "72px 1fr 16px 1fr",
                        gap: "6px",
                        fontSize: "12px",
                        alignItems: "center",
                      }}
                    >
                      {episode.deltas
                        .filter((d) => d.field !== "since")
                        .map((delta) => (
                          <div
                            key={delta.field}
                            style={{ display: "contents" }}
                          >
                            <span style={{ color: "#6B7280" }}>
                              {delta.label}
                            </span>
                            <span
                              style={{
                                color: delta.changed
                                  ? "#6B7280"
                                  : "var(--color-text-primary)",
                                fontWeight: delta.changed ? 400 : 500,
                              }}
                            >
                              {delta.previous}
                            </span>
                            <span
                              style={{ color: "#854F0B", textAlign: "center" }}
                            >
                              {delta.changed ? "→" : ""}
                            </span>
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
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })()}
            {episode.patientVoice && (
              <div
                className="px-3 py-2.5 rounded-lg text-[13px] text-sp-text-primary italic"
                style={{
                  background: "var(--color-background-secondary)",
                  border: "0.5px solid #E5E7EB",
                }}
              >
                "{episode.patientVoice}"
              </div>
            )}
            {latest && latest.photos.length > 0 && (
              <button
                onClick={() => setPhotoDrawerOpen(true)}
                className="mt-3 flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors hover:opacity-80"
                style={{ background: "#F3F4F6", border: "0.5px solid #E5E7EB" }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "white",
                    border: "0.5px solid #E5E7EB",
                  }}
                >
                  <ImageIcon
                    size={16}
                    className="text-sp-text-secondary opacity-50"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sp-text-primary">
                    Attached photos
                  </p>
                  <p className="text-[13px] text-sp-text-secondary">
                    {latest.photos.length} photo
                    {latest.photos.length > 1 ? "s" : ""} · click to view
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className="text-sp-text-secondary flex-shrink-0"
                  style={{ transform: "rotate(-90deg)" }}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Key indicators ── */}
      {(() => {
        const TRENDING = new Set([
          "8867-4",
          "29463-7",
          "39156-5",
          "55284-4",
          "72514-3",
        ]);
        const trending = vitalSeries.filter((v) => TRENDING.has(v.code));
        if (trending.length === 0) return null;
        return (
          <div className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
            <SectionLabel>Key indicators</SectionLabel>
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-3">
                {trending.slice(0, 3).map((v) => (
                  <div
                    key={v.code}
                    onClick={() => setVitalDrawer(v)}
                    className="cursor-pointer rounded-card"
                    style={{ outline: "0.5px solid transparent" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.outline = "0.5px solid #1F5C5E")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.outline =
                        "0.5px solid transparent")
                    }
                  >
                    <VitalCard
                      label={v.display}
                      value={v.latest}
                      unit={v.unit}
                      trend={v.trend}
                      history={v.history}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Empty state ── */}
      {!hasHistory && !hasSignal && (
        <div className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
          <SectionLabel>Clinical history</SectionLabel>
          <div className="px-6 py-8 text-center">
            <Activity
              size={28}
              className="mx-auto mb-3 text-sp-text-secondary opacity-30"
            />
            <p className="text-[14px] font-medium text-sp-text-secondary mb-1">
              No clinical history recorded
            </p>
            <p className="text-[12px] text-sp-text-secondary opacity-70 mb-4">
              First consultation — start building the clinical record
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setVitalSignDrawerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ border: "0.5px solid #1F5C5E", color: "#1F5C5E" }}
              >
                <Plus size={13} /> Record vital signs
              </button>
              <button
                onClick={() => setConditionDrawerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ border: "0.5px solid #1F5C5E", color: "#1F5C5E" }}
              >
                <Plus size={13} /> Add conditions
              </button>
              <button
                onClick={() => setMedicationDrawerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ border: "0.5px solid #1F5C5E", color: "#1F5C5E" }}
              >
                <Plus size={13} /> Add medication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Folders ── */}
      {hasHistory && (
        <div
          ref={foldersRef}
          className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden flex flex-col flex-1 relative"
        >
          <div
            className="sticky top-0 z-10 bg-sp-surface"
            style={{ borderBottom: "1px solid #E5E7EB" }}
          >
            <div className="flex items-center justify-between pr-4">
              <FolderTabs
                tabs={tabs}
                activeTab={activeTab}
                onSelect={(tab) => {
                  setActiveTab(tab);
                  setTimeout(() => {
                    foldersRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 50);
                }}
              />
            </div>
          </div>

          <div className="flex-1" style={{ minHeight: "500px" }}>
            {/* Vitals tab */}
            {activeTab === "vitals" && (
              <div className="px-6 py-4">
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => setVitalSignDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ border: "0.5px solid #1F5C5E", color: "#1F5C5E" }}
                  >
                    <Plus size={13} /> Record vital sign
                  </button>
                </div>
                {(() => {
                  const PHYSICAL_PROFILE = new Set([
                    "8302-2",
                    "29463-7",
                    "39156-5",
                  ]);
                  const THREE_MONTHS_AGO = new Date();
                  THREE_MONTHS_AGO.setMonth(THREE_MONTHS_AGO.getMonth() - 3);

                  const profileVitals = vitalSeries.filter((v) =>
                    PHYSICAL_PROFILE.has(v.code),
                  );
                  const trendingVitals = vitalSeries.filter((v) => {
                    if (PHYSICAL_PROFILE.has(v.code)) return false;
                    const recentRecords = v.history.filter((h) => {
                      const d = new Date(h.date);
                      return !isNaN(d.getTime()) && d >= THREE_MONTHS_AGO;
                    });
                    return recentRecords.length >= 3;
                  });

                  if (
                    profileVitals.length === 0 &&
                    trendingVitals.length === 0
                  ) {
                    return (
                      <p className="text-[12px] text-sp-text-secondary italic">
                        No vitals recorded
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-5">
                      {/* Physical profile */}
                      {profileVitals.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary mb-2">
                            Physical assessment
                          </p>
                          <div
                            className="flex gap-6 px-4 py-3 rounded-lg"
                            style={{
                              background: "#F9FAFB",
                              border: "0.5px solid #E5E7EB",
                            }}
                          >
                            {profileVitals.map((v) => {
                              const { label, stale } = formatVitalDate(
                                v.latestDate,
                              );
                              return (
                                <div key={v.code} className="flex flex-col">
                                  <span className="text-[11px] text-sp-text-secondary">
                                    {v.display}
                                  </span>
                                  <span className="text-[16px] font-medium text-sp-text-primary">
                                    {v.latest}
                                    <span className="text-[11px] font-normal text-sp-text-secondary ml-1">
                                      {v.unit}
                                    </span>
                                  </span>
                                  <span
                                    className="text-[10px]"
                                    style={{
                                      color: stale ? "#854F0B" : "#9CA3AF",
                                    }}
                                  >
                                    {label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Trending vitals */}
                      {trendingVitals.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary mb-2">
                            Vital signs trend
                          </p>
                          <table
                            className="w-full text-[13px]"
                            style={{ tableLayout: "fixed" }}
                          >
                            <thead>
                              <tr
                                style={{ borderBottom: "0.5px solid #E5E7EB" }}
                              >
                                <th
                                  className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                                  style={{ width: "30%" }}
                                >
                                  Vital
                                </th>
                                <th
                                  className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                                  style={{ width: "20%" }}
                                >
                                  Latest
                                </th>
                                <th
                                  className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                                  style={{ width: "15%" }}
                                >
                                  Trend
                                </th>
                                <th
                                  className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                                  style={{ width: "20%" }}
                                >
                                  Sparkline
                                </th>
                                <th
                                  className="text-right pb-2 text-[11px] font-medium text-sp-text-secondary"
                                  style={{ width: "15%" }}
                                >
                                  Date
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {trendingVitals.map((v) => {
                                const max = Math.max(
                                  ...v.history.map((h) => h.value),
                                  1,
                                );
                                const { label, stale } = formatVitalDate(
                                  v.latestDate,
                                );
                                const trendColor =
                                  v.trend === "up"
                                    ? "#A32D2D"
                                    : v.trend === "down"
                                      ? "#0F6E56"
                                      : "#6B7280";
                                const trendLabel =
                                  v.trend === "up"
                                    ? "↑ Increasing"
                                    : v.trend === "down"
                                      ? "↓ Decreasing"
                                      : "→ Stable";
                                return (
                                  <tr
                                    key={v.code}
                                    onClick={() => setVitalDrawer(v)}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    style={{
                                      borderBottom: "0.5px solid #F3F4F6",
                                    }}
                                  >
                                    <td className="py-3 font-medium text-sp-text-primary">
                                      {v.display}
                                    </td>
                                    <td className="py-3 text-sp-text-primary">
                                      {v.latest}
                                      <span className="text-[11px] text-sp-text-secondary ml-1">
                                        {v.unit}
                                      </span>
                                    </td>
                                    <td
                                      className="py-3 text-[11px]"
                                      style={{ color: trendColor }}
                                    >
                                      {trendLabel}
                                    </td>
                                    <td className="py-3">
                                      <div
                                        className="flex items-end gap-0.5"
                                        style={{
                                          height: "18px",
                                          width: "60px",
                                        }}
                                      >
                                        {v.history
                                          .slice(-6)
                                          .map((h, i, arr) => (
                                            <div
                                              key={i}
                                              className="flex-1 rounded-sm"
                                              style={{
                                                height: `${Math.round((h.value / max) * 100)}%`,
                                                background:
                                                  i === arr.length - 1
                                                    ? "#1F5C5E"
                                                    : "#A8C4C5",
                                              }}
                                            />
                                          ))}
                                      </div>
                                    </td>
                                    <td
                                      className="py-3 text-right text-[11px]"
                                      style={{
                                        color: stale ? "#854F0B" : "#9CA3AF",
                                      }}
                                    >
                                      {label}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {trendingVitals.length === 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary mb-2">
                            Vital signs trend
                          </p>
                          <p className="text-[12px] text-sp-text-secondary italic">
                            No clinical trend available. 3+ records in the past
                            90 days required.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Conditions tab */}
            {activeTab === "conditions" && (
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex gap-1 p-1 rounded-lg"
                      style={{ background: "#F3F4F6" }}
                    >
                      <button
                        onClick={() => setConditionTypeFilter(null)}
                        className="px-3 py-1.5 rounded text-[12px] font-medium transition-all"
                        style={{
                          background:
                            conditionTypeFilter === null
                              ? "white"
                              : "transparent",
                          color:
                            conditionTypeFilter === null
                              ? "#1F5C5E"
                              : "#6B7280",
                          boxShadow:
                            conditionTypeFilter === null
                              ? "0 1px 3px rgba(0,0,0,0.08)"
                              : "none",
                        }}
                      >
                        All types
                      </button>
                      {[
                        ...new Set(
                          conditions
                            .map((c) => parseConditionDisplay(c.display).type)
                            .filter(Boolean),
                        ),
                      ].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setConditionTypeFilter(
                              conditionTypeFilter === type ? null : type,
                            )
                          }
                          className="px-3 py-1.5 rounded text-[12px] font-medium transition-all capitalize"
                          style={{
                            background:
                              conditionTypeFilter === type
                                ? "white"
                                : "transparent",
                            color:
                              conditionTypeFilter === type
                                ? "#1F5C5E"
                                : "#6B7280",
                            boxShadow:
                              conditionTypeFilter === type
                                ? "0 1px 3px rgba(0,0,0,0.08)"
                                : "none",
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div
                      style={{
                        width: "0.5px",
                        height: "20px",
                        background: "#E5E7EB",
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-sp-text-secondary">
                        Status
                      </span>
                      {(["all", "active", "resolved"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setConditionFilter(f)}
                          className="text-[11px] font-medium transition-all capitalize"
                          style={{
                            color:
                              conditionFilter === f ? "#1F5C5E" : "#9CA3AF",
                            textDecoration:
                              conditionFilter === f ? "underline" : "none",
                            textUnderlineOffset: "3px",
                          }}
                        >
                          {f === "all" ? "All" : f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setConditionDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ border: "0.5px solid #1F5C5E", color: "#1F5C5E" }}
                  >
                    <Plus size={13} /> Add condition
                  </button>
                </div>
                <div style={{ minHeight: "250px" }}>
                  {(() => {
                    const filtered = conditions
                      .filter(
                        (c) =>
                          conditionFilter === "all" ||
                          c.status === conditionFilter,
                      )
                      .filter(
                        (c) =>
                          !conditionTypeFilter ||
                          parseConditionDisplay(c.display).type ===
                            conditionTypeFilter,
                      );
                    if (filtered.length === 0)
                      return (
                        <div className="flex items-center justify-center py-12">
                          <p className="text-[12px] text-sp-text-secondary italic">
                            No conditions match the selected filters
                          </p>
                        </div>
                      );
                    return (
                      <table
                        className="w-full text-[13px]"
                        style={{ tableLayout: "fixed" }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid #E5E7EB" }}>
                            <th
                              className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                              style={{ width: "55%" }}
                            >
                              Condition
                            </th>
                            <th
                              className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                              style={{ width: "25%" }}
                            >
                              Onset
                            </th>
                            <th
                              className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                              style={{ width: "20%" }}
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((c) => (
                            <tr
                              key={c.id}
                              style={{ borderBottom: "0.5px solid #F3F4F6" }}
                            >
                              <td
                                className="py-2.5"
                                style={{ wordBreak: "break-word" }}
                              >
                                {(() => {
                                  const { name, type } = parseConditionDisplay(
                                    c.display,
                                  );
                                  return (
                                    <span>
                                      <span className="text-sp-text-primary">
                                        {name}
                                      </span>
                                      {type && (
                                        <span
                                          className="ml-2 text-[10px] py-0.5 rounded"
                                          style={{
                                            color: "hsl(218, 11%, 40%)",
                                          }}
                                        >
                                          {type}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="py-2.5 text-sp-text-secondary">
                                {c.onset}
                              </td>
                              <td className="py-2.5">
                                <span
                                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                                  style={{
                                    background:
                                      c.status === "active"
                                        ? "#E1F5EE"
                                        : "#F3F4F6",
                                    color:
                                      c.status === "active"
                                        ? "#085041"
                                        : "#6B7280",
                                  }}
                                >
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Medication tab */}
            {activeTab === "medication" && (
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex gap-1 p-1 rounded-lg w-fit"
                    style={{ background: "#F3F4F6" }}
                  >
                    {(["all", "active", "completed"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setMedicationFilter(f)}
                        className="px-3 py-1.5 rounded text-[12px] font-medium transition-all"
                        style={{
                          background:
                            medicationFilter === f ? "white" : "transparent",
                          color: medicationFilter === f ? "#1F5C5E" : "#6B7280",
                          boxShadow:
                            medicationFilter === f
                              ? "0 1px 3px rgba(0,0,0,0.08)"
                              : "none",
                        }}
                      >
                        {f === "all"
                          ? `All · ${medications.length}`
                          : f.charAt(0).toUpperCase() +
                            f.slice(1) +
                            ` · ${medications.filter((m) => m.status === f).length}`}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setMedicationDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ border: "0.5px solid #1F5C5E", color: "#1F5C5E" }}
                  >
                    <Plus size={13} /> Add medication
                  </button>
                </div>
                <div style={{ minHeight: "250px" }}>
                  {(() => {
                    const filtered =
                      medicationFilter === "all"
                        ? medications
                        : medications.filter(
                            (m) => m.status === medicationFilter,
                          );
                    if (filtered.length === 0)
                      return (
                        <p className="text-[12px] text-sp-text-secondary italic">
                          No medication recorded
                        </p>
                      );
                    return (
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid #E5E7EB" }}>
                            <th className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary">
                              Medication
                            </th>
                            <th className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary">
                              Dose
                            </th>
                            <th className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary w-28">
                              Since
                            </th>
                            <th className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary w-24">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((m) => {
                            const parsed = parseMedicationDisplay(m.display);
                            return (
                              <tr
                                key={m.id}
                                style={{ borderBottom: "0.5px solid #F3F4F6" }}
                              >
                                <td className="py-2.5 font-medium text-sp-text-primary">
                                  {parsed.name}
                                </td>
                                <td className="py-2.5 text-sp-text-secondary">
                                  {[parsed.dose, parsed.form]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}
                                </td>
                                <td className="py-2.5 text-sp-text-secondary">
                                  {m.authoredOn ?? "—"}
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className="text-[10px] font-medium px-2 py-0.5 rounded"
                                    style={{
                                      background:
                                        m.status === "active"
                                          ? "#E1F5EE"
                                          : "#F3F4F6",
                                      color:
                                        m.status === "active"
                                          ? "#085041"
                                          : "#6B7280",
                                    }}
                                  >
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Labs tab */}
            {activeTab === "labs" && (
              <div className="px-6 py-4">
                {/* Filters row */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={labSearch}
                    onChange={(e) => setLabSearch(e.target.value)}
                    className="px-3 py-1.5 text-[12px] rounded-lg outline-none transition-colors"
                    style={{
                      background: "#F9FAFB",
                      border: "0.5px solid #E5E7EB",
                      width: "180px",
                      color: "var(--color-text-primary)",
                    }}
                  />

                  {/* Period filter */}
                  <div
                    className="flex gap-1 p-1 rounded-lg"
                    style={{ background: "#F3F4F6" }}
                  >
                    {(
                      [
                        ["30", "Last 30 days"],
                        ["60", "Last 60 days"],
                        ["all", "Older"],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setLabFilter(val)}
                        className="px-3 py-1.5 rounded text-[12px] font-medium transition-all"
                        style={{
                          background:
                            labFilter === val ? "white" : "transparent",
                          color: labFilter === val ? "#1F5C5E" : "#6B7280",
                          boxShadow:
                            labFilter === val
                              ? "0 1px 3px rgba(0,0,0,0.08)"
                              : "none",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ minHeight: "200px" }}>
                  {(() => {
                    const now = new Date();
                    const filtered = observations.filter((o) => {
                      if (o.category !== "labs") return false;
                      const date = new Date(o.dateIso);
                      const daysAgo =
                        (now.getTime() - date.getTime()) / 86400000;
                      const matchesPeriod =
                        labFilter === "30"
                          ? daysAgo <= 30
                          : labFilter === "60"
                            ? daysAgo > 30 && daysAgo <= 60
                            : daysAgo > 60;
                      const cleanName = o.display
                        .split("[")[0]
                        .split("(")[0]
                        .trim()
                        .toLowerCase();
                      const matchesSearch =
                        labSearch === "" ||
                        cleanName.includes(labSearch.toLowerCase());
                      return matchesPeriod && matchesSearch;
                    });

                    if (filtered.length === 0)
                      return (
                        <div className="flex items-center justify-center py-12">
                          <p className="text-[12px] text-sp-text-secondary italic">
                            {labSearch
                              ? `No results for "${labSearch}"`
                              : "No lab results in this period"}
                          </p>
                        </div>
                      );

                    return (
                      <table
                        className="w-full text-[13px]"
                        style={{ tableLayout: "fixed" }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid #E5E7EB" }}>
                            <th
                              className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                              style={{ width: "50%", minWidth: "180px" }}
                            >
                              Test
                            </th>
                            <th
                              className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                              style={{ width: "25%", minWidth: "80px" }}
                            >
                              Value
                            </th>
                            <th
                              className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                              style={{ width: "25%", minWidth: "80px" }}
                            >
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((o) => (
                            <tr
                              key={o.id}
                              style={{ borderBottom: "0.5px solid #F3F4F6" }}
                            >
                              <td
                                className="py-2 text-sp-text-primary"
                                style={{ wordBreak: "break-word" }}
                              >
                                {o.display.split("[")[0].split("(")[0].trim()}
                              </td>
                              <td className="py-2 font-medium text-sp-text-primary">
                                {o.value}
                                {o.unit && (
                                  <span className="text-[11px] font-normal text-sp-text-secondary ml-1">
                                    {o.unit}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-sp-text-secondary">
                                {o.date}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Scores tab */}
            {activeTab === "scores" && (
              <div className="px-6 py-4 ">
                {(() => {
                  const scores = observations.filter(
                    (o) => o.category === "scores",
                  );
                  if (scores.length === 0)
                    return (
                      <p className="text-[12px] text-sp-text-secondary italic">
                        No scores recorded
                      </p>
                    );

                  const grouped = new Map<string, typeof scores>();
                  scores.forEach((o) => {
                    const name = cleanScoreName(o.display);
                    if (!grouped.has(name)) grouped.set(name, []);
                    grouped.get(name)!.push(o);
                  });

                  return (
                    <div className="space-y-2">
                      {[...grouped.entries()].map(([name, records]) => {
                        const sorted = [...records].sort((a, b) =>
                          b.dateIso.localeCompare(a.dateIso),
                        );
                        const latest = sorted[0];
                        console.log(name, latest.dateIso, latest.date);
                        const { label, stale } = formatVitalDate(
                          latest.dateIso,
                        );
                        const isExpanded = expandedScore === name;

                        return (
                          <div
                            key={name}
                            className="rounded-lg overflow-hidden"
                            style={{ border: "0.5px solid #E5E7EB" }}
                            ref={(el) => {
                              if (el) scoreRefs.current.set(name, el);
                            }}
                          >
                            {/* Header row */}
                            <div
                              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              style={{ background: "#F9FAFB" }}
                              onClick={() => {
                                const newExpanded = isExpanded ? null : name;
                                setExpandedScore(newExpanded);
                                if (newExpanded) {
                                  setTimeout(() => {
                                    scoreRefs.current
                                      .get(name)
                                      ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "nearest",
                                      });
                                  }, 50);
                                }
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-sp-text-primary">
                                  {name}
                                </p>
                                <p
                                  className="text-[10px] mt-0.5"
                                  style={{
                                    color: stale ? "#854F0B" : "#9CA3AF",
                                  }}
                                >
                                  Last record · {label}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <p className="text-[18px] font-medium text-sp-text-primary">
                                  {latest.value}
                                  <span className="text-[11px] font-normal text-sp-text-secondary ml-1">
                                    {latest.unit}
                                  </span>
                                </p>
                                <ChevronDown
                                  size={14}
                                  className="text-sp-text-secondary transition-transform duration-200"
                                  style={{
                                    transform: isExpanded
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Expanded table */}
                            {isExpanded && (
                              <div
                                className="px-4 py-3"
                                style={{ borderTop: "0.5px solid #E5E7EB" }}
                              >
                                <table
                                  className="w-full text-[12px]"
                                  style={{ tableLayout: "fixed" }}
                                >
                                  <thead>
                                    <tr
                                      style={{
                                        borderBottom: "0.5px solid #F3F4F6",
                                      }}
                                    >
                                      <th
                                        className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary"
                                        style={{ width: "140px" }}
                                      >
                                        Date
                                      </th>
                                      <th className="text-left pb-2 text-[11px] font-medium text-sp-text-secondary">
                                        Score
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sorted.map((r, i) => (
                                      <tr
                                        key={r.id}
                                        style={{
                                          borderBottom: "0.5px solid #F9FAFB",
                                        }}
                                      >
                                        <td className="py-1.5 text-sp-text-secondary">
                                          {r.date}
                                        </td>
                                        <td
                                          className="py-1.5 font-medium"
                                          style={{
                                            color:
                                              i === 0
                                                ? "#1F5C5E"
                                                : "var(--color-text-primary)",
                                          }}
                                        >
                                          {r.value}
                                          {r.unit && (
                                            <span className="text-[10px] font-normal text-sp-text-secondary ml-1">
                                              {r.unit}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Consultations tab */}
            {activeTab === "consultations" && (
              <div className="px-6 py-4 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] text-sp-text-secondary">
                    {consultations.length} consultation
                    {consultations.length !== 1 ? "s" : ""} recorded
                  </p>
                </div>

                {showSavedBanner && (
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-3 text-[12px] font-medium transition-opacity duration-700"
                    style={{
                      background: "#E1F5EE",
                      color: "#085041",
                      border: "0.5px solid #A8C4C5",
                      opacity: bannerVisible ? 1 : 0,
                    }}
                  >
                    <CheckCircle size={13} />
                    Consultation note saved successfully
                  </div>
                )}

                {consultationsLoading ? (
                  <div className="flex items-center gap-2 text-sp-text-secondary">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-[12px]">Loading…</span>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[12px] text-sp-text-secondary italic">
                      No consultation notes recorded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {consultations.map((c) => {
                      const isExpanded =
                        expandedConsultation === c.id || newNoteId === c.id;
                      return (
                        <div
                          key={c.id}
                          className="rounded-lg overflow-hidden"
                          style={{ border: "0.5px solid #0F6E56" }}
                        >
                          {/* Header */}
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{ background: "#F9FAFB" }}
                            onClick={() =>
                              setExpandedConsultation(isExpanded ? null : c.id)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <p className="text-[13px] font-medium text-sp-text-primary">
                                {c.chiefComplaint}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAmendingNote(c);
                                  setConsultationDrawerOpen(true);
                                }}
                                className="text-[11px] hover:opacity-70 transition-opacity"
                                style={{ color: "#1F5C5E" }}
                              >
                                Amend register
                              </button>
                              <span className="text-[12px] text-sp-text-secondary">
                                {c.date}
                              </span>

                              <ChevronDown
                                size={14}
                                className="text-sp-text-secondary transition-transform duration-200"
                                style={{
                                  transform: isExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                }}
                              />
                            </div>
                          </div>

                          {/* SOAP detail */}
                          {isExpanded && (
                            <div
                              className="px-4 py-4 space-y-3"
                              style={{ borderTop: "0.5px solid #E5E7EB" }}
                            >
                              {[
                                {
                                  label: "S",
                                  title: "Subjective",
                                  value: c.subjective,
                                },
                                {
                                  label: "O",
                                  title: "Objective",
                                  value: c.objective,
                                },
                                {
                                  label: "A",
                                  title: "Assessment",
                                  value: c.assessment,
                                },
                                { label: "P", title: "Plan", value: c.plan },
                              ].map((section) => (
                                <div key={section.label} className="flex gap-3">
                                  <span
                                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                                    style={{ background: "#1F5C5E" }}
                                  >
                                    {section.label}
                                  </span>
                                  <div>
                                    <p className="text-[11px] font-medium text-sp-text-secondary uppercase tracking-wide mb-0.5">
                                      {section.title}
                                    </p>
                                    <p className="text-[13px] text-sp-text-primary leading-relaxed">
                                      {section.value || (
                                        <span className="italic text-sp-text-secondary">
                                          Not recorded
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              {(() => {
                                const original = consultations.find(
                                  (o) => o.id === c.amendsId,
                                );
                                if (!original) return null;
                                return (
                                  <div
                                    className="mt-3 pt-3"
                                    style={{ borderTop: "0.5px solid #E5E7EB" }}
                                  >
                                    <p
                                      className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                                      style={{ color: "#9CA3AF" }}
                                    >
                                      Previous version · {original.date}
                                    </p>
                                    {[
                                      {
                                        label: "S",
                                        title: "Subjective",
                                        value: original.subjective,
                                      },
                                      {
                                        label: "O",
                                        title: "Objective",
                                        value: original.objective,
                                      },
                                      {
                                        label: "A",
                                        title: "Assessment",
                                        value: original.assessment,
                                      },
                                      {
                                        label: "P",
                                        title: "Plan",
                                        value: original.plan,
                                      },
                                    ].map((section) =>
                                      section.value ? (
                                        <div
                                          key={section.label}
                                          className="flex gap-3 mb-2"
                                        >
                                          <span
                                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                                            style={{
                                              background: "#F3F4F6",
                                              color: "#9CA3AF",
                                            }}
                                          >
                                            {section.label}
                                          </span>
                                          <p
                                            className="text-[12px] leading-relaxed"
                                            style={{
                                              color: "#9CA3AF",
                                              textDecoration: "line-through",
                                            }}
                                          >
                                            {section.value}
                                          </p>
                                        </div>
                                      ) : null,
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ConsultationDrawer
        open={consultationDrawerOpen}
        patientId={patient.id}
        amendNote={amendingNote ?? undefined}
        onClose={() => {
          setConsultationDrawerOpen(false);
          setAmendingNote(null);
        }}
        onSuccess={(id) => {
          setNewNoteId(null); // reset primero
          setConsultationDrawerOpen(false);
          setAmendingNote(null);
          refetchConsultations();
          setActiveTab("consultations");
          setShowSavedBanner(true);
          setBannerVisible(true);
          setTimeout(() => setBannerVisible(false), 2500);
          setTimeout(() => setShowSavedBanner(false), 3200);
          setTimeout(() => {
            foldersRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
          setTimeout(() => {
            setNewNoteId(id); // seteamos después de que refetch tuvo tiempo de completarse
          }, 1500);
        }}
      />

      <PhotoDrawer
        open={photoDrawerOpen}
        photos={latest?.photos ?? []}
        onClose={() => setPhotoDrawerOpen(false)}
      />

      <ConditionDrawer
        open={conditionDrawerOpen}
        patientId={patient.id}
        onClose={() => setConditionDrawerOpen(false)}
        onSuccess={() => {
          setConditionDrawerOpen(false);
          window.location.reload();
        }}
      />
      <MedicationDrawer
        open={medicationDrawerOpen}
        patientId={patient.id}
        onClose={() => setMedicationDrawerOpen(false)}
        onSuccess={() => {
          setMedicationDrawerOpen(false);
          window.location.reload();
        }}
      />
      <VitalSignDrawer
        open={vitalSignDrawerOpen}
        patientId={patient.id}
        onClose={() => setVitalSignDrawerOpen(false)}
        onSuccess={() => {
          setVitalSignDrawerOpen(false);
          window.location.reload();
        }}
      />

      <VitalDrawer
        open={vitalDrawer !== null}
        vital={vitalDrawer}
        onClose={() => setVitalDrawer(null)}
      />

      <PatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => window.location.reload()}
        patient={{
          id: patient.id,
          given: patient.name.split(" ")[0],
          family: patient.name.split(" ").slice(1).join(" "),
          gender: patient.gender,
          birthDate: patient.birthDate,
        }}
      />
      <div className="h-12" />
    </div>
  );
}
