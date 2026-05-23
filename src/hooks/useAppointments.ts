import { useCallback, useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

export interface FHIRAppointment {
  id: string;
  status: string;
  start?: string;
  end?: string;
  description?: string;
  serviceType?: Array<{
    coding?: Array<{ display?: string }>;
  }>;
  participant?: Array<{
    actor?: {
      reference?: string;
      display?: string;
    };
    status?: string;
  }>;
}

export interface AppointmentRow {
  id: string;
  patientId: string | null;
  patientName: string;
  time: string;
  start: string;
  reason: string;
  status: string;
}

function parsePatientId(reference?: string): string | null {
  if (!reference) return null;
  const parts = reference.split("/");
  return parts[parts.length - 1] ?? null;
}

function formatTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function useAppointments(date: Date = new Date()) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NUEVO: fetchAppointments es reutilizable para refetch
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const d = date.toISOString().split("T")[0];
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const dateEnd = next.toISOString().split("T")[0];

      const res = await fhirClient.get<{
        entry?: Array<{ resource: FHIRAppointment }>;
      }>(
        `/Appointment?date=ge${d}&date=lt${dateEnd}&_sort=date&_count=50&status=booked,pending,arrived,fulfilled,noshow,cancelled`,
      );

      const entries = res.data.entry ?? [];
      const rows: AppointmentRow[] = entries.map(({ resource: appt }) => {
        const patientParticipant = appt.participant?.find(
          (p) =>
            p.actor?.reference?.startsWith("Patient/") ||
            p.actor?.reference?.startsWith("patient/"),
        );

        const patientId = parsePatientId(patientParticipant?.actor?.reference);
        const patientName =
          patientParticipant?.actor?.display ?? "Unknown patient";

        const reason =
          appt.description ??
          appt.serviceType?.[0]?.coding?.[0]?.display ??
          "No reason recorded";

        return {
          id: appt.id,
          patientId,
          patientName,
          time: formatTime(appt.start),
          start: appt.start ?? "",
          reason,
          status: appt.status,
        };
      });

      setAppointments(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading schedule");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAppointments();
    return () => {};
  }, [fetchAppointments]);

  // NUEVO: refetch expuesto para el simulator y otros componentes
  return { appointments, loading, error, refetch: fetchAppointments };
}
