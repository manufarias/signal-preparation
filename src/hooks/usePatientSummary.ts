import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

export interface ConditionSummary {
  id: string;
  display: string;
  verificationStatus: "confirmed" | "provisional" | "unconfirmed" | "unknown";
  recordedDate: string | null;
  lastUpdated: string | null;
}

export interface MedicationSummary {
  id: string;
  display: string;
}

export interface PatientSummary {
  conditions: ConditionSummary[];
  medications: MedicationSummary[];
  lastObservation: {
    display: string;
    value: string;
    unit: string;
    date: string;
  } | null;
  nextAppointment: { time: string; reason: string } | null;
  polypharmacy: {
    detected: boolean;
    reason: string | null;
  };
  clinicalRecordsDate: string | null;
  loading: boolean;
  error: string | null;
}

const CHRONIC_KEYWORDS = [
  "hypertension",
  "diabetes",
  "hypothyroidism",
  "copd",
  "heart failure",
  "renal",
  "asthma",
  "gerd",
  "obesity",
  "hyperlipidemia",
  "anxiety",
  "depression",
];

function isChronic(name: string): boolean {
  return CHRONIC_KEYWORDS.some((k) => name.toLowerCase().includes(k));
}

function getPolypharmacy(
  medications: MedicationSummary[],
  conditions: ConditionSummary[],
  patientAge?: number,
): PatientSummary["polypharmacy"] {
  if (medications.length < 5) return { detected: false, reason: null };

  const isElderly = patientAge != null && patientAge >= 65;
  const hasChronic = conditions.some(
    (c) => c.verificationStatus === "confirmed" && isChronic(c.display),
  );

  let reason: string;
  if (isElderly && hasChronic) {
    reason = `Age ≥65 and chronic condition · ${medications.length} active medications — medication reconciliation suggested`;
  } else if (isElderly) {
    reason = `Age ≥65 · ${medications.length} active medications — medication reconciliation suggested`;
  } else if (hasChronic) {
    reason = `Chronic condition · ${medications.length} active medications — medication reconciliation suggested`;
  } else {
    reason = `${medications.length} active medications — medication reconciliation suggested`;
  }

  return { detected: true, reason };
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function usePatientSummary(
  patientId: string | null,
  patientAge?: number,
): PatientSummary {
  const [conditions, setConditions] = useState<ConditionSummary[]>([]);
  const [medications, setMedications] = useState<MedicationSummary[]>([]);
  const [lastObservation, setLastObservation] =
    useState<PatientSummary["lastObservation"]>(null);
  const [nextAppointment, setNextAppointment] =
    useState<PatientSummary["nextAppointment"]>(null);
  const [clinicalRecordsDate, setClinicalRecordsDate] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split("T")[0];

    Promise.all([
      fhirClient.get(
        `/Condition?patient=${patientId}&clinical-status=active&category=problem-list-item&_count=5`,
      ),
      fhirClient.get(
        `/MedicationRequest?patient=${patientId}&status=active&_count=10`,
      ),
      fhirClient.get(`/Observation?patient=${patientId}&_sort=-date&_count=1`),
      fhirClient.get(
        `/Appointment?patient=${patientId}&date=ge${today}&_sort=date&_count=1`,
      ),
    ])
      .then(([condRes, medRes, obsRes, apptRes]) => {
        // Conditions
        const conds: ConditionSummary[] = (condRes.data.entry ?? []).map(
          (e: any) => {
            const r = e.resource;
            const verCode =
              r.verificationStatus?.coding?.[0]?.code ?? "unknown";
            return {
              id: r.id,
              display:
                r.code?.text ?? r.code?.coding?.[0]?.display ?? "Condition",
              verificationStatus: [
                "confirmed",
                "provisional",
                "unconfirmed",
              ].includes(verCode)
                ? (verCode as ConditionSummary["verificationStatus"])
                : "unknown",
              recordedDate: formatDate(r.recordedDate ?? r.onsetDateTime),
              lastUpdated: formatDate(r.meta?.lastUpdated),
            };
          },
        );
        setConditions(conds);

        // Most recent condition update for header date
        const latestUpdate =
          conds
            .map((c) => c.lastUpdated)
            .filter(Boolean)
            .sort()
            .reverse()[0] ?? null;
        setClinicalRecordsDate(latestUpdate);

        // Medications — increase limit to detect polypharmacy
        const meds: MedicationSummary[] = (medRes.data.entry ?? []).map(
          (e: any) => ({
            id: e.resource.id,
            display:
              e.resource.medicationCodeableConcept?.text ??
              e.resource.medicationCodeableConcept?.coding?.[0]?.display ??
              "Medication",
          }),
        );
        setMedications(meds);

        // Last observation
        const obsEntry = obsRes.data.entry?.[0]?.resource;
        if (obsEntry) {
          const q = obsEntry.valueQuantity;
          setLastObservation({
            display:
              obsEntry.code?.text ??
              obsEntry.code?.coding?.[0]?.display ??
              "Observation",
            value: q?.value != null ? String(q.value) : "—",
            unit: q?.unit ?? "",
            date: obsEntry.effectiveDateTime
              ? new Date(obsEntry.effectiveDateTime).toLocaleDateString(
                  "en-US",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                )
              : "—",
          });
        }

        // Next appointment
        const apptEntry = apptRes.data.entry?.[0]?.resource;
        if (apptEntry) {
          setNextAppointment({
            time: apptEntry.start
              ? new Date(apptEntry.start).toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }) +
                " · " +
                new Date(apptEntry.start).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "—",
            reason: apptEntry.description ?? "No reason recorded",
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId, patientAge]);

  const polypharmacy = getPolypharmacy(medications, conditions, patientAge);

  return {
    conditions,
    medications,
    lastObservation,
    nextAppointment,
    polypharmacy,
    clinicalRecordsDate,
    loading,
    error,
  };
}
