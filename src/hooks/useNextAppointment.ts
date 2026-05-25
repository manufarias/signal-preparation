import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";
import type { FHIRAppointment } from "./useAppointments";

export interface NextAppointment {
  id: string;
  patientName: string;
  patientId: string | null;
  time: string;
  start: Date;
  minutesUntil: number;
}

export function useNextAppointment() {
  const [next, setNext] = useState<NextAppointment | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function fetchToday() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const res = await fhirClient.get<{
          entry?: Array<{ resource: FHIRAppointment }>;
        }>(
          `/Appointment?date=ge${today}&date=lt${tomorrowStr}&_sort=date&_count=50&status=booked,pending,arrived`,
        );

        const entries = res.data.entry ?? [];

        function tick() {
          const now = new Date();
          const upcoming = entries
            .map(({ resource: appt }) => {
              if (!appt.start) return null;
              const start = new Date(appt.start);
              const minutesUntil = Math.round(
                (start.getTime() - now.getTime()) / 60000,
              );
              if (minutesUntil < -2 || minutesUntil > 60) return null;

              const patientParticipant = appt.participant?.find((p) =>
                p.actor?.reference?.startsWith("Patient/"),
              );
              const patientId =
                patientParticipant?.actor?.reference?.split("/")[1] ?? null;
              const patientName =
                patientParticipant?.actor?.display ?? "Unknown patient";

              return {
                id: appt.id,
                patientName,
                patientId,
                time: start.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }),
                start,
                minutesUntil,
              };
            })
            .filter(Boolean)
            .sort((a, b) => a!.minutesUntil - b!.minutesUntil);

          setNext(upcoming[0] ?? null);
        }

        tick();
        interval = setInterval(tick, 30000);
      } catch {
        setNext(null);
      }
    }

    fetchToday();
    return () => clearInterval(interval);
  }, []);

  return next;
}
