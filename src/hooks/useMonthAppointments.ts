import { useCallback, useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";
import type { AppointmentRow, FHIRAppointment } from "./useAppointments";
import type { DayLoad } from "./useWeekAppointments";

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

export function useMonthAppointments(date: Date) {
  const [days, setDays] = useState<DayLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const year = date.getFullYear();
      const month = date.getMonth();

      const dateStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(year, month + 1, 1);
      const dateEnd = nextMonth.toISOString().split("T")[0];

      const res = await fhirClient.get<{
        entry?: Array<{ resource: FHIRAppointment }>;
      }>(
        `/Appointment?date=ge${dateStart}&date=lt${dateEnd}&_sort=date&_count=500&status=booked,pending,arrived,fulfilled,noshow,cancelled`,
      );

      const entries = res.data.entry ?? [];

      // Build all working days of the month
      const monthDays: DayLoad[] = [];
      const current = new Date(year, month, 1);
      while (current.getMonth() === month) {
        const dow = current.getDay();
        if (dow !== 0 && dow !== 6) {
          const d = new Date(current);
          monthDays.push({
            date: d,
            dateStr: d.toISOString().split("T")[0],
            label: d.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
            }),
            appointments: [],
            total: 0,
          });
        }
        current.setDate(current.getDate() + 1);
      }

      // Distribute appointments
      for (const { resource: appt } of entries) {
        if (!appt.start) continue;
        const apptDay = appt.start.split("T")[0];
        const dayLoad = monthDays.find((d) => d.dateStr === apptDay);
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

      setDays(monthDays);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading month");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  return { days, loading, error };
}
