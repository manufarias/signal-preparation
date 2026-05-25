import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

export interface TodayAppointment {
  id: string;
  time: string;
  reason: string;
  status: string;
}

export function useTodayAppointment(patientId: string | undefined) {
  const [appointment, setAppointment] = useState<TodayAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    async function fetch() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const res = await fhirClient.get<{ entry?: Array<{ resource: any }> }>(
          `/Appointment?patient=${patientId}&date=ge${today}&date=lt${tomorrowStr}&_sort=date&_count=1`,
        );

        if (cancelled) return;

        const appt = res.data.entry?.[0]?.resource;
        if (appt) {
          setAppointment({
            id: appt.id,
            time: appt.start
              ? new Date(appt.start).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "—",
            reason:
              appt.description ?? appt.serviceType?.[0]?.text ?? "Consultation",
            status: appt.status ?? "booked",
          });
        } else {
          setAppointment(null);
        }
      } catch {
        setAppointment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { appointment, loading };
}
