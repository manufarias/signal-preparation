import { useCallback, useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";
import type { AppointmentRow, FHIRAppointment } from "./useAppointments";

export interface DayLoad {
  date: Date;
  dateStr: string; // "2026-05-18"
  label: string; // "Mon 18"
  appointments: AppointmentRow[];
  total: number;
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

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function useWeekAppointments(date: Date) {
  const [days, setDays] = useState<DayLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const monday = getMonday(date);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 7);

      const dateStart = monday.toISOString().split("T")[0];
      const dateEnd = sunday.toISOString().split("T")[0];

      const res = await fhirClient.get<{
        entry?: Array<{ resource: FHIRAppointment }>;
      }>(
        `/Appointment?date=ge${dateStart}&date=lt${dateEnd}&_sort=date&_count=200&status=booked,pending,arrived,fulfilled,noshow,cancelled`,
      );

      const entries = res.data.entry ?? [];

      // Construir los 5 días laborables (lun-vie)
      const weekDays: DayLoad[] = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
          date: d,
          dateStr: d.toISOString().split("T")[0],
          label: d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          }),
          appointments: [],
          total: 0,
        };
      });

      // Distribuir appointments por día
      for (const { resource: appt } of entries) {
        if (!appt.start) continue;
        const apptDay = appt.start.split("T")[0];
        const dayLoad = weekDays.find((d) => d.dateStr === apptDay);
        if (!dayLoad) continue;

        const patientParticipant = appt.participant?.find(
          (p) =>
            p.actor?.reference?.startsWith("Patient/") ||
            p.actor?.reference?.startsWith("patient/"),
        );

        dayLoad.appointments.push({
          id: appt.id,
          patientId: parsePatientId(patientParticipant?.actor?.reference),
          patientName: patientParticipant?.actor?.display ?? "Unknown patient",
          time: formatTime(appt.start),
          start: appt.start ?? "",
          reason: appt.description ?? "No reason recorded",
          status: appt.status,
        });
        dayLoad.total++;
      }

      setDays(weekDays);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading week");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  return { days, loading, error };
}
