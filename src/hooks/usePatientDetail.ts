import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

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
  dateIso: string;
  status: string;
  category: "vitals" | "labs" | "scores" | "social" | "other";
}

export interface VitalSeries {
  code: string;
  display: string;
  unit: string;
  latest: string;
  latestDate: string;
  history: { date: string; value: number }[];
  trend: "up" | "down" | "stable";
}

export interface Condition {
  id: string;
  display: string;
  status: string;
  verificationStatus: string;
  onset: string;
  recordedDate: string | null;
}

export interface Medication {
  id: string;
  display: string;
  status: string;
  dosage: string;
  authoredOn: string | null;
}

export interface PatientDetailResult {
  patient: PatientDetail | null;
  observations: Observation[];
  vitalSeries: VitalSeries[];
  conditions: Condition[];
  medications: Medication[];
  loading: boolean;
  error: string | null;
}

// ── Vital codes we track for sparklines ──────────────────────────────
const VITAL_CODES: Record<string, string> = {
  "55284-4": "Blood pressure",
  "8867-4": "Heart rate",
  "29463-7": "Body weight",
  "39156-5": "BMI",
  "8302-2": "Body height",
  "8310-5": "Body temperature",
  "9279-1": "Respiratory rate",
  "72514-3": "Pain severity",
};

function calcAge(birthDate: string): number {
  const dob = new Date(birthDate);
  return Math.floor(
    (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function cleanUnit(unit: string): string {
  if (unit === "{score}" || unit === "{Score}") return "/10";
  if (unit === "{beats}/min") return "/min";
  return unit;
}

const VITAL_LOINC = new Set([
  "8867-4",
  "29463-7",
  "39156-5",
  "55284-4",
  "8302-2",
  "8310-5",
  "9279-1",
  "72514-3",
  "8480-6",
  "8462-4",
]);
const LAB_LOINC = new Set([
  "2093-3",
  "2571-8",
  "2085-9",
  "13457-7",
  "18262-6",
  "718-7",
  "4544-3",
  "786-4",
  "787-2",
  "785-6",
  "788-0",
  "789-8",
  "26515-7",
  "32207-3",
  "32623-1",
  "6690-2",
  "789-8",
]);
const SCORE_LOINC = new Set([
  "44249-1",
  "69737-5",
  "72109-2",
  "75626-2",
  "68517-2",
  "55758-7",
]);
const SOCIAL_LOINC = new Set(["72166-2", "82810-3", "56051-6", "93025-5"]);

function categorizeObservation(
  loincCode: string,
  display: string,
): "vitals" | "labs" | "scores" | "social" | "other" {
  if (VITAL_LOINC.has(loincCode)) return "vitals";
  if (LAB_LOINC.has(loincCode)) return "labs";
  if (SCORE_LOINC.has(loincCode)) return "scores";
  if (SOCIAL_LOINC.has(loincCode)) return "social";

  const d = display.toLowerCase();
  if (
    d.includes("score") ||
    d.includes("phq") ||
    d.includes("gad") ||
    d.includes("audit") ||
    d.includes("hark") ||
    d.includes("prapare")
  )
    return "scores";
  if (
    d.includes("tobacco") ||
    d.includes("employment") ||
    d.includes("education") ||
    d.includes("pregnancy") ||
    d.includes("housing")
  )
    return "social";
  if (
    d.includes("cholesterol") ||
    d.includes("triglyceride") ||
    d.includes("hemoglobin") ||
    d.includes("hematocrit") ||
    d.includes("leukocyte") ||
    d.includes("platelet") ||
    d.includes("erythrocyte") ||
    d.includes("mchc") ||
    d.includes("mch") ||
    d.includes("mcv")
  )
    return "labs";
  if (
    d.includes("height") ||
    d.includes("weight") ||
    d.includes("bmi") ||
    d.includes("blood pressure") ||
    d.includes("heart rate") ||
    d.includes("respiratory") ||
    d.includes("temperature")
  )
    return "vitals";

  return "other";
}

function formatValue(resource: Record<string, unknown>): {
  value: string;
  unit: string;
  numeric: number | null;
} {
  if (resource.valueQuantity) {
    const q = resource.valueQuantity as {
      value?: number;
      unit?: string;
      code?: string;
    };
    return {
      value: q.value != null ? String(q.value) : "—",
      unit: cleanUnit(q.unit ?? q.code ?? ""),
      numeric: q.value ?? null,
    };
  }
  if (resource.component) {
    const comps = resource.component as Array<{
      code?: { coding?: Array<{ code?: string }> };
      valueQuantity?: { value?: number; unit?: string };
    }>;
    const sys = comps.find(
      (c) => c.code?.coding?.[0]?.code === "8480-6",
    )?.valueQuantity;
    const dia = comps.find(
      (c) => c.code?.coding?.[0]?.code === "8462-4",
    )?.valueQuantity;
    if (sys && dia) {
      return {
        value: `${sys.value}/${dia.value}`,
        unit: sys.unit ?? "mmHg",
        numeric: sys.value ?? null,
      };
    }
  }
  if (resource.valueCodeableConcept) {
    const c = resource.valueCodeableConcept as {
      text?: string;
      coding?: Array<{ display?: string }>;
    };
    return {
      value: c.text ?? c.coding?.[0]?.display ?? "—",
      unit: "",
      numeric: null,
    };
  }
  if (resource.valueString) {
    return { value: String(resource.valueString), unit: "", numeric: null };
  }
  return { value: "—", unit: "", numeric: null };
}

function calcTrend(history: { value: number }[]): "up" | "down" | "stable" {
  if (history.length < 2) return "stable";
  const last = history[history.length - 1].value;
  const prev = history[history.length - 2].value;
  const pct = Math.abs((last - prev) / prev);
  if (pct < 0.03) return "stable";
  return last > prev ? "up" : "down";
}

export function usePatientDetail(
  patientId: string | undefined,
): PatientDetailResult {
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [vitalSeries, setVitalSeries] = useState<VitalSeries[]>([]);
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
          }>(`/Observation?patient=${patientId}&_sort=-date&_count=100`),
          fhirClient.get<{
            entry?: Array<{ resource: Record<string, unknown> }>;
          }>(`/Condition?patient=${patientId}&_sort=-onset-date&_count=50`),
          fhirClient.get<{
            entry?: Array<{ resource: Record<string, unknown> }>;
          }>(`/MedicationRequest?patient=${patientId}&_count=50`),
        ]);

        if (cancelled) return;

        // Patient
        const p = patRes.data;
        const nameArr = p.name as
          | Array<{ text?: string; given?: string[]; family?: string }>
          | undefined;
        const nameObj = nameArr?.[0];
        const rawName =
          nameObj?.text ??
          [nameObj?.given?.join(" "), nameObj?.family]
            .filter(Boolean)
            .join(" ") ??
          "Unknown";
        const name = rawName.replace(/\d+/g, "").replace(/\s+/g, " ").trim();

        setPatient({
          id: String(p.id),
          name,
          gender: String(p.gender ?? "—"),
          birthDate: String(p.birthDate ?? ""),
          age: p.birthDate ? calcAge(String(p.birthDate)) : 0,
        });

        // Observations
        const allObs: Observation[] = (obsRes.data.entry ?? [])
          .filter(({ resource: r }) => {
            const code = r.code as { coding?: Array<{ system?: string }> };
            return !code?.coding?.some(
              (c) => c.system === "https://signal.health/observation",
            );
          })
          .map(({ resource: r }) => {
            const code = r.code as {
              text?: string;
              coding?: Array<{ display?: string; code?: string }>;
            };
            const loincCode =
              (code as any)?.coding?.find(
                (c: any) => c.system === "http://loinc.org",
              )?.code ?? "";
            const { value, unit } = formatValue(r);
            const dateIso = String(r.effectiveDateTime ?? r.issued ?? "");
            const display =
              code?.text ?? code?.coding?.[0]?.display ?? "Observation";
            return {
              id: String(r.id),
              code: loincCode,
              display,
              value,
              unit,
              date: formatDate(dateIso),
              dateIso,
              status: String(r.status ?? ""),
              category: categorizeObservation(loincCode, display),
            };
          });

        setObservations(allObs);

        // Vital series — group by LOINC code, build sparklines
        const seriesMap = new Map<
          string,
          {
            display: string;
            unit: string;
            points: { date: string; dateIso: string; value: number }[];
          }
        >();

        for (const { resource: r } of obsRes.data.entry ?? []) {
          const code = r.code as {
            coding?: Array<{ code?: string; system?: string }>;
          };
          const loincCode = code?.coding?.find(
            (c) => c.system === "http://loinc.org",
          )?.code;
          if (!loincCode || !VITAL_CODES[loincCode]) continue;

          const { value, unit, numeric } = formatValue(r);
          if (numeric === null) continue;

          const dateIso = String(r.effectiveDateTime ?? r.issued ?? "");
          if (!seriesMap.has(loincCode)) {
            seriesMap.set(loincCode, {
              display: VITAL_CODES[loincCode],
              unit,
              points: [],
            });
          }
          seriesMap.get(loincCode)!.points.push({
            date: formatDate(dateIso),
            dateIso,
            value: numeric,
          });
        }

        const series: VitalSeries[] = [];
        for (const [code, { display, unit, points }] of seriesMap) {
          const sorted = points.sort((a, b) =>
            a.dateIso.localeCompare(b.dateIso),
          );
          const latest = sorted[sorted.length - 1];
          series.push({
            code,
            display,
            unit,
            latest: String(latest.value),
            latestDate: latest.date,
            history: sorted.map((p) => ({ date: p.date, value: p.value })),
            trend: calcTrend(sorted),
          });
        }

        setVitalSeries(series);

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
            const vs = r.verificationStatus as {
              coding?: Array<{ code?: string }>;
            };
            return {
              id: String(r.id),
              display: code?.text ?? code?.coding?.[0]?.display ?? "Condition",
              status: cs?.coding?.[0]?.code ?? "active",
              verificationStatus: vs?.coding?.[0]?.code ?? "unknown",
              onset: formatDate(String(r.onsetDateTime ?? "")),
              recordedDate: r.recordedDate
                ? formatDate(String(r.recordedDate))
                : null,
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
                medCode?.text ?? medCode?.coding?.[0]?.display ?? "Medication",
              status: String(r.status ?? ""),
              dosage: dosage?.[0]?.text ?? "—",
              authoredOn: r.authoredOn
                ? formatDate(String(r.authoredOn))
                : null,
            };
          },
        );
        setMedications(meds);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Error loading patient",
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

  return {
    patient,
    observations,
    vitalSeries,
    conditions,
    medications,
    loading,
    error,
  };
}
