import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

// ── Types ──────────────────────────────────────────────────────────────

export interface PatientDetail {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  age: number;
}

export interface Observation {
  id: string;
  code: string;
  display: string;
  value: string;
  unit: string;
  date: string;
  status: string;
}

export interface Condition {
  id: string;
  display: string;
  status: string;
  onset: string;
}

export interface Medication {
  id: string;
  display: string;
  status: string;
  dosage: string;
}

export interface PatientDetailResult {
  patient: PatientDetail | null;
  observations: Observation[];
  conditions: Condition[];
  medications: Medication[];
  loading: boolean;
  error: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────

function calcAge(birthDate: string): number {
  const dob = new Date(birthDate);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatValue(resource: Record<string, unknown>): {
  value: string;
  unit: string;
} {
  if (resource.valueQuantity) {
    const q = resource.valueQuantity as {
      value?: number;
      unit?: string;
      code?: string;
    };
    return {
      value: q.value != null ? String(q.value) : "—",
      unit: q.unit ?? q.code ?? "",
    };
  }
  if (resource.valueCodeableConcept) {
    const c = resource.valueCodeableConcept as {
      text?: string;
      coding?: Array<{ display?: string }>;
    };
    return { value: c.text ?? c.coding?.[0]?.display ?? "—", unit: "" };
  }
  if (resource.valueString)
    return { value: String(resource.valueString), unit: "" };
  if (resource.valueBoolean != null)
    return { value: String(resource.valueBoolean), unit: "" };
  return { value: "—", unit: "" };
}

// ── Hook ───────────────────────────────────────────────────────────────

export function usePatientDetail(
  patientId: string | undefined,
): PatientDetailResult {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const [patRes, obsRes, condRes, medRes] = await Promise.all([
          fhirClient.get<Record<string, unknown>>(`/Patient/${patientId}`),
          fhirClient.get<{
            entry?: Array<{ resource: Record<string, unknown> }>;
          }>(`/Observation?patient=${patientId}&_sort=-date&_count=20`),
          fhirClient.get<{
            entry?: Array<{ resource: Record<string, unknown> }>;
          }>(
            `/Condition?patient=${patientId}&clinical-status=active&_sort=-onset-date&_count=20`,
          ),
          fhirClient.get<{
            entry?: Array<{ resource: Record<string, unknown> }>;
          }>(`/MedicationRequest?patient=${patientId}&status=active&_count=20`),
        ]);

        if (cancelled) return;

        // Patient
        const p = patRes.data;
        const nameArr = p.name as
          | Array<{ text?: string; given?: string[]; family?: string }>
          | undefined;
        const nameObj = nameArr?.[0];
        const name =
          nameObj?.text ??
          [nameObj?.given?.join(" "), nameObj?.family]
            .filter(Boolean)
            .join(" ") ??
          "Sin nombre";

        setPatient({
          id: String(p.id),
          name,
          gender: String(p.gender ?? "—"),
          birthDate: String(p.birthDate ?? ""),
          age: p.birthDate ? calcAge(String(p.birthDate)) : 0,
        });

        // Observations
        const obs: Observation[] = (obsRes.data.entry ?? []).map(
          ({ resource: r }) => {
            const code = r.code as {
              text?: string;
              coding?: Array<{ display?: string; code?: string }>;
            };
            const { value, unit } = formatValue(r);
            return {
              id: String(r.id),
              code: code?.coding?.[0]?.code ?? "",
              display:
                code?.text ?? code?.coding?.[0]?.display ?? "Observación",
              value,
              unit,
              date: formatDate(String(r.effectiveDateTime ?? r.issued ?? "")),
              status: String(r.status ?? ""),
            };
          },
        );
        setObservations(obs);

        // Conditions
        const conds: Condition[] = (condRes.data.entry ?? []).map(
          ({ resource: r }) => {
            const code = r.code as {
              text?: string;
              coding?: Array<{ display?: string }>;
            };
            const cs = r.clinicalStatus as {
              coding?: Array<{ code?: string }>;
            };
            return {
              id: String(r.id),
              display: code?.text ?? code?.coding?.[0]?.display ?? "Condición",
              status: cs?.coding?.[0]?.code ?? "active",
              onset: formatDate(String(r.onsetDateTime ?? "")),
            };
          },
        );
        setConditions(conds);

        // Medications
        const meds: Medication[] = (medRes.data.entry ?? []).map(
          ({ resource: r }) => {
            const medCode = r.medicationCodeableConcept as {
              text?: string;
              coding?: Array<{ display?: string }>;
            };
            const dosage = r.dosageInstruction as
              | Array<{ text?: string }>
              | undefined;
            return {
              id: String(r.id),
              display:
                medCode?.text ?? medCode?.coding?.[0]?.display ?? "Medicación",
              status: String(r.status ?? ""),
              dosage: dosage?.[0]?.text ?? "—",
            };
          },
        );
        setMedications(meds);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Error al cargar paciente",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { patient, observations, conditions, medications, loading, error };
}
