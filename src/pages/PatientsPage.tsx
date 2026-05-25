import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Search,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import usePatients from "../hooks/usePatients";
import type { Patient } from "../hooks/usePatients";
import { useDebounce } from "../hooks/useDebounce";
import { PatientDrawer } from "../components/PatientDrawer/PatientDrawer";
import { usePatientSummary } from "../hooks/usePatientSummary";
import { PanelHeader } from "../components/PanelHeader/PanelHeader";
import {} from "lucide-react";
import { parseMedicationDisplay } from "../utils/parseMedication";

// ── Helpers ────────────────────────────────────────────────────────────

function calcAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function initials(patient: Patient): string {
  const given = patient.name[0]?.given[0]?.[0] ?? "";
  const family = patient.name[0]?.family?.[0] ?? "";
  return `${given}${family}`.toUpperCase();
}

function genderLabel(gender: string): string {
  if (gender === "male") return "Male";
  if (gender === "female") return "Female";
  return gender;
}

// ── Panel derecho — empty state ────────────────────────────────────────

function EmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-sp-text-secondary">
      <User size={28} className="mb-3 opacity-20" />
      <p className="text-[14px] font-medium">Select a patient</p>
    </div>
  );
}

// ── Panel derecho — resumen clínico ────────────────────────────────────

function PatientPanel({ patient }: { patient: Patient }) {
  const summary = usePatientSummary(patient.id);
  const navigate = useNavigate();
  const [backgroundOpen, setBackgroundOpen] = useState(false);

  const firstName = patient.name[0].given[0];
  const fullName = `${firstName} ${patient.name[0].family}`;
  const age = calcAge(patient.birthDate);
  const gender =
    patient.gender === "male"
      ? "Male"
      : patient.gender === "female"
        ? "Female"
        : patient.gender;

  function buildPatientContext(): string {
    const sentences: string[] = [];
    const confirmedConditions = summary.conditions
      .filter((c) => c.verificationStatus === "confirmed")
      .map((c) => c.display);

    if (confirmedConditions.length > 0) {
      sentences.push(
        `${firstName} presents with **${confirmedConditions.slice(0, 2).join("** and **")}**`,
      );
    }
    if (summary.medications.length > 0) {
      sentences.push(
        `Currently on **${summary.medications.length}** active medication${summary.medications.length > 1 ? "s" : ""}`,
      );
    }
    if (sentences.length === 0) {
      sentences.push(`${firstName} has no recorded clinical history`);
    }
    return sentences.join(". ") + ".";
  }

  function renderBold(text: string) {
    return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} className="font-medium text-sp-text-primary">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PanelHeader
        title={fullName}
        titleSecondary={`${age}y · ${gender}`}
        action={{
          label: "View full chart",
          onClick: () => navigate(`/patient/${patient.id}`),
        }}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Context + next appointment */}
        <div className="border-b border-gray-200 px-5 py-4 space-y-3">
          {summary.loading ? (
            <div className="flex items-center gap-2 text-sp-text-secondary">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[12px]">Loading…</span>
            </div>
          ) : (
            <>
              <p className="text-[14px] text-sp-text-primary leading-relaxed">
                {renderBold(buildPatientContext())}
              </p>
              {summary.nextAppointment && (
                <p className="text-[12px] text-sp-text-secondary">
                  <span className="font-medium text-sp-text-primary">
                    Next appointment
                  </span>
                  {" · "}
                  {summary.nextAppointment.time}
                  {" · "}
                  {summary.nextAppointment.reason.split("—")[0].trim()}
                </p>
              )}
            </>
          )}
        </div>

        {/* Clinical background — acordeón */}
        {summary.conditions.length === 0 && summary.medications.length === 0 ? (
          <div className="px-5 py-3 border-t border-gray-200">
            <p className="text-[11px] text-sp-text-secondary italic">
              No clinical history recorded
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setBackgroundOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-3 bg-gray-100 border-b border-gray-200  transition-colors hover:bg-gray-200"
            >
              <div className="flex items-center gap-2 ">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sp-text-secondary">
                  Clinical background
                </p>
                {summary.clinicalRecordsDate && (
                  <p className="text-[10px] text-sp-text-secondary">
                    Last records available · {summary.clinicalRecordsDate}
                  </p>
                )}
              </div>{" "}
              <span
                className="text-[12px] font-medium transition-colors mr-3"
                style={{ color: "#1F5C5E" }}
              >
                {backgroundOpen ? "Close" : "Open"}
              </span>
            </button>

            {backgroundOpen && (
              <div className="px-5 py-4">
                {summary.loading ? null : (
                  <div className="space-y-4">
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
                              padding: "10px",
                            }}
                          >
                            <p
                              className="text-[13px] font-medium text-sp-text-primary"
                              style={{
                                lineHeight: 1.3,
                                wordBreak: "break-word",
                              }}
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
                              onClick={() => navigate(`/patient/${patient.id}`)}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────

export function PatientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const search = useDebounce(searchInput, 400);
  const { patients, loading, error, refetch } = usePatients(search);

  return (
    <div className="space-y-4">
      {/* Search + botón */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-text-secondary"
          />
          <input
            type="text"
            placeholder="Search by name …"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-sp-surface border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors placeholder:text-sp-text-secondary"
          />
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sp-primary text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + Create patient
        </button>
      </div>

      {/* Master-detail 30/70 */}
      <div className="flex gap-4 h-[calc(100vh-195px)]">
        {/* Lista — 30% */}
        <div className="w-[30%] bg-sp-surface rounded-card shadow-card-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-sp-border flex-shrink-0">
            <p className="text-[14px] text-sp-text-secondary">
              {patients.length} patient{patients.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-sp-text-secondary">
                <Loader2 size={18} className="animate-spin mr-2" />
                <span className="text-[13px]">Searching…</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 py-8 px-4 text-red-600">
                <AlertCircle size={14} />
                <span className="text-[13px]">Loading error</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sp-text-secondary px-4">
                <p className="text-[13px] font-medium text-center">
                  No results
                </p>
                {searchInput && (
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="mt-3 text-[12px] text-sp-primary underline underline-offset-2 hover:opacity-70"
                  >
                    Create "{searchInput}"
                  </button>
                )}
              </div>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelected(patient)}
                  className={[
                    "flex items-center gap-3 px-4 py-3 w-full text-left",
                    "border-b border-sp-border last:border-b-0 transition-colors duration-100",
                    selected?.id === patient.id
                      ? "bg-sp-bg border-l-2 border-l-sp-primary"
                      : "hover:bg-sp-bg",
                  ].join(" ")}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1F5C5E" }}
                  >
                    <span className="text-[11px] font-semibold text-white">
                      {initials(patient)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-medium text-sp-text-primary truncate">
                      {patient.name[0].given[0]} {patient.name[0].family}
                    </p>
                    <p className="text-[14px] text-sp-text-secondary mt-0.5">
                      {calcAge(patient.birthDate)} años ·{" "}
                      {genderLabel(patient.gender)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho — 70% */}
        <div className="flex-1 bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
          {selected ? <PatientPanel patient={selected} /> : <EmptyPanel />}
        </div>
      </div>

      <PatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
