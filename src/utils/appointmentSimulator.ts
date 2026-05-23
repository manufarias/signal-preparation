import { fhirClient } from "../api/fhir";
import type { AppointmentRow } from "../hooks/useAppointments";

// ── Helpers ────────────────────────────────────────────────────────────

async function updateStatus(
  appt: AppointmentRow,
  status: string,
): Promise<void> {
  // GET primero para preservar todos los campos del recurso
  const res = await fhirClient.get(`/Appointment/${appt.id}`);
  const current = res.data;

  // PUT con el recurso completo + nuevo status
  await fhirClient.put(`/Appointment/${appt.id}`, {
    ...current,
    status,
  });
}

// ── Backfill ───────────────────────────────────────────────────────────
// Corre una vez al iniciar — marca los turnos pasados como fulfilled o noshow

export async function backfillPastAppointments(
  appointments: AppointmentRow[],
  onUpdate: () => void,
): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 60 * 1000);

  const past = appointments.filter((a) => {
    if (!a.start) return false;
    const apptTime = new Date(a.start);
    return (
      apptTime < now &&
      a.status !== "fulfilled" &&
      a.status !== "noshow" &&
      a.status !== "cancelled"
    );
  });

  if (past.length === 0) return;

  const updates = past.map((appt) => {
    // 80% fulfilled, 20% noshow — distribución realista
    const status = Math.random() < 0.8 ? "fulfilled" : "noshow";
    return updateStatus(appt, status).catch((err) =>
      console.error(`Backfill error for ${appt.id}:`, err),
    );
  });

  await Promise.all(updates);
  onUpdate();
}

// ── Simulator ──────────────────────────────────────────────────────────
// Corre en background — convierte pending → booked cada 2 minutos

export function startSimulator(
  appointments: AppointmentRow[],
  onUpdate: () => void,
  intervalMs: number = 120000,
): () => void {
  const timer = setInterval(async () => {
    const now = new Date();

    // Solo appointments futuros que están pending
    const candidates = appointments.filter((a) => {
      if (!a.start) return false;
      const apptTime = new Date(a.start);
      return apptTime > now && a.status === "pending";
    });

    if (candidates.length === 0) return;

    const appt = candidates[Math.floor(Math.random() * candidates.length)];

    try {
      await updateStatus(appt, "booked");
      onUpdate();
    } catch (err) {
      console.error("Simulator error:", err);
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
