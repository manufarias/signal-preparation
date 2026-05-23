import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Pill,
  Activity,
  FileText,
  User,
} from "lucide-react";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { PatientDrawer } from "../components/PatientDrawer/PatientDrawer";
import { usePageTitle } from "../context/PageTitleContext";

// ── Section card wrapper ───────────────────────────────────────────────
// MODIFICADO: acepta `action` opcional para mostrar un link en el header

function Section({
  title,
  icon: Icon,
  children,
  empty,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  empty?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-sp-surface rounded-card shadow-card-sm overflow-hidden">
      {/* MODIFICADO: header con justify-between para acomodar el action */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-sp-border">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-sp-primary-light" />
          <span className="text-[13px] font-semibold text-sp-text-primary">
            {title}
          </span>
        </div>
        {action}
      </div>
      <div className="px-5 py-4">
        {children}
        {empty && (
          <p className="text-[13px] text-sp-text-secondary italic">{empty}</p>
        )}
      </div>
    </div>
  );
}

// ── KV row ─────────────────────────────────────────────────────────────

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2 border-b border-sp-border last:border-b-0">
      <span className="text-[12px] text-sp-text-secondary flex-shrink-0 w-32">
        {label}
      </span>
      <span className="text-[13px] font-medium text-sp-text-primary text-right">
        {value}
      </span>
    </div>
  );
}

// ── Observation row ────────────────────────────────────────────────────

function ObsRow({
  display,
  value,
  unit,
  date,
}: {
  display: string;
  value: string;
  unit: string;
  date: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_120px] gap-3 py-2 border-b border-sp-border last:border-b-0 items-baseline">
      <span className="text-[13px] text-sp-text-primary truncate">
        {display}
      </span>
      <span className="text-[13px] font-semibold text-sp-primary tabular-nums">
        {value}
        {unit && (
          <span className="text-[11px] font-normal text-sp-text-secondary ml-1">
            {unit}
          </span>
        )}
      </span>
      <span className="text-[11px] text-sp-text-secondary text-right">
        {date}
      </span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────

export function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, observations, conditions, medications, loading, error } =
    usePatientDetail(id);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { setPageTitle } = usePageTitle();
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!patient) return;
    const gender =
      patient.gender === "male" ? "M" : patient.gender === "female" ? "F" : "";
    const stickyTitle = `${patient.name} · ${patient.age}y · ${gender}`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPageTitle(entry.isIntersecting ? undefined : stickyTitle);
      },
      { threshold: 0 },
    );
    if (demoRef.current) observer.observe(demoRef.current);
    return () => {
      observer.disconnect();
      setPageTitle(undefined); // limpia al salir
    };
  }, [patient]);

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

  return (
    <div className="space-y-5 max-w-4xl mx-auto py-5">
      {/* ref solo en este div — solo la card de demographics */}
      <div ref={demoRef}>
        <Section
          title="Patient details"
          icon={User}
          action={
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-[12px] text-sp-primary hover:opacity-70 transition-opacity"
            >
              Edit
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-x-8">
            <KV label="Name" value={patient.name} />
            <KV label="Age" value={`${patient.age} years old`} />
            <KV
              label="Sex"
              value={
                patient.gender === "male"
                  ? "Male"
                  : patient.gender === "female"
                    ? "Female"
                    : patient.gender
              }
            />
            <KV label="Date of birth" value={patient.birthDate} />
          </div>
        </Section>
      </div>

      {/* El resto fuera del ref */}
      <div className="grid grid-cols-2 gap-5">
        <Section
          title="Active conditions"
          icon={FileText}
          empty={conditions.length === 0 ? "No conditions recorded" : undefined}
        >
          {conditions.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-baseline py-2 border-b border-sp-border last:border-b-0 gap-3"
            >
              <span className="text-[13px] text-sp-text-primary">
                {c.display}
              </span>
              <span className="text-[11px] text-sp-text-secondary flex-shrink-0">
                {c.onset}
              </span>
            </div>
          ))}
        </Section>

        <Section
          title="Active medication"
          icon={Pill}
          empty={
            medications.length === 0 ? "No medication recorded" : undefined
          }
        >
          {medications.map((m) => (
            <div
              key={m.id}
              className="py-2 border-b border-sp-border last:border-b-0"
            >
              <p className="text-[13px] font-medium text-sp-text-primary">
                {m.display}
              </p>
              {m.dosage !== "—" && (
                <p className="text-[11px] text-sp-text-secondary mt-0.5">
                  {m.dosage}
                </p>
              )}
            </div>
          ))}
        </Section>
      </div>

      <Section
        title="Recent observations"
        icon={Activity}
        empty={
          observations.length === 0 ? "No observations recorded" : undefined
        }
      >
        {observations.map((o) => (
          <ObsRow
            key={o.id}
            display={o.display}
            value={o.value}
            unit={o.unit}
            date={o.date}
          />
        ))}
      </Section>

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
      <div className="h-12"></div>
    </div>
  );
}
