import { useCallback, useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

export interface FHIRAppointment {
  id: string;
  status: string;
  start?: string;
  end?: string;
  description?: string;
  serviceType?: Array<{ coding?: Array<{ display?: string }> }>;
  participant?: Array<{
    actor?: { reference?: string; display?: string };
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

const CACHE_KEY = "signal_appointments_cache";
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

interface AppointmentCache {
  date: string;
  timestamp: number;
  appointments: AppointmentRow[];
}

function saveCache(date: string, appointments: AppointmentRow[]) {
  const cache: AppointmentCache = {
    date,
    timestamp: Date.now(),
    appointments,
  };
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function readCache(
  date: string,
): { appointments: AppointmentRow[]; cachedAt: Date } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: AppointmentCache = JSON.parse(raw);
    if (cache.date !== date) return null;
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) return null;
    return {
      appointments: cache.appointments,
      cachedAt: new Date(cache.timestamp),
    };
  } catch {
    return null;
  }
}

export function useAppointments(date: Date = new Date()) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const d = date.toISOString().split("T")[0];

    try {
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

      saveCache(d, rows);
      setCachedAt(null);
      setAppointments(rows);
    } catch (err: unknown) {
      // Intentar leer del cache
      const cached = readCache(d);
      if (cached) {
        setAppointments(cached.appointments);
        setCachedAt(cached.cachedAt);
        setError(null);
        window.dispatchEvent(
          new CustomEvent("fhir-cache-active", {
            detail: cached.cachedAt.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          }),
        );
      } else {
        setError(err instanceof Error ? err.message : "Error loading schedule");
      }
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAppointments();
    return () => {};
  }, [fetchAppointments]);

  return { appointments, loading, error, cachedAt, refetch: fetchAppointments };
}
