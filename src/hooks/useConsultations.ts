import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

export interface ConsultationNote {
  id: string;
  encounterId: string | null;
  date: string;
  dateIso: string;
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  amendsId: string | null;
}

function extractSection(sections: any[], loincCode: string): string {
  const section = sections?.find((s: any) =>
    s.code?.coding?.some((c: any) => c.code === loincCode),
  );
  return section?.text?.div?.replace(/<[^>]+>/g, "") ?? "";
}

export function useConsultations(patientId: string | undefined) {
  const [consultations, setConsultations] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fhirClient.get<{
          entry?: Array<{ resource: any }>;
        }>(
          `/Composition?subject=Patient/${patientId}&type=11488-4&_sort=-date&_count=20`,
        );

        if (cancelled) return;

        const notes: ConsultationNote[] = (res.data.entry ?? []).map(
          ({ resource: r }) => ({
            id: r.id,
            encounterId: r.encounter?.reference?.split("/")[1] ?? null,
            date:
              new Date(r.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }) +
              " · " +
              new Date(r.date).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
            dateIso: r.date,
            chiefComplaint: r.title ?? "",
            subjective: extractSection(r.section, "61150-9"),
            objective: extractSection(r.section, "61149-1"),
            assessment: extractSection(r.section, "51847-2"),
            plan: extractSection(r.section, "18776-5"),
            amendsId:
              r.relatesTo
                ?.find((rel: any) => rel.code === "replaces")
                ?.targetReference?.reference?.split("/")[1] ?? null,
          }),
        );

        setConsultations(notes);
      } catch {
        setConsultations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [patientId, refresh]);

  return {
    consultations,
    loading,
    refetch: () => setRefresh((r) => r + 1),
  };
}
