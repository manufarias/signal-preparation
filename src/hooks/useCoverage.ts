import { useEffect, useState } from "react";
import { fhirClient } from "../api/fhir";

export type CoverageStatus = "active" | "expiring" | "expired" | "not_recorded";

export interface CoverageItem {
  status: CoverageStatus;
  label: string;
  expiry: string | null;
}

export interface PatientCoverage {
  insurance: CoverageItem;
  chronicRegistry: CoverageItem;
  affiliationId: string | null;
  loading: boolean;
}

function parseStatus(periodEnd: string | null): CoverageStatus {
  if (!periodEnd) return "active";
  const end = new Date(periodEnd);
  const now = new Date();
  const daysUntil = Math.round((end.getTime() - now.getTime()) / 86400000);
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 60) return "expiring";
  return "active";
}

function formatExpiry(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildLabel(status: CoverageStatus, expiry: string | null): string {
  switch (status) {
    case "active":
      return expiry ? `Active · ${expiry}` : "Active";
    case "expiring":
      return `Expires ${expiry}`;
    case "expired":
      return `Expired ${expiry}`;
    case "not_recorded":
      return "Not recorded";
  }
}

const NOT_RECORDED: CoverageItem = {
  status: "not_recorded",
  label: "Not recorded",
  expiry: null,
};

export function useCoverage(patientId: string | undefined): PatientCoverage {
  const [coverage, setCoverage] = useState<PatientCoverage>({
    insurance: NOT_RECORDED,
    chronicRegistry: NOT_RECORDED,
    affiliationId: null,
    loading: true,
  });

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    async function fetch() {
      try {
        const res = await fhirClient.get<{
          entry?: Array<{ resource: any }>;
        }>(
          `/Coverage?beneficiary=Patient/${patientId}&_tag=https://signal.health|coverage&_count=10`,
        );

        if (cancelled) return;

        const entries = res.data.entry ?? [];

        let insurance: CoverageItem = NOT_RECORDED;
        let chronicRegistry: CoverageItem = NOT_RECORDED;
        let affiliationId: string | null = null;

        for (const { resource: r } of entries) {
          const typeCode = r.type?.coding?.[0]?.code ?? "";
          const periodEnd = r.period?.end ?? null;
          const fhirStatus = r.status ?? "active";

          const status =
            fhirStatus === "cancelled" ? "expired" : parseStatus(periodEnd);

          const expiry = formatExpiry(periodEnd);
          const label = buildLabel(status, expiry);

          if (typeCode === "insurance") {
            insurance = { status, label, expiry };
            affiliationId = r.subscriberId ?? null;
          } else if (typeCode === "chronic-registry") {
            chronicRegistry = { status, label, expiry };
          }
        }

        setCoverage({
          insurance,
          chronicRegistry,
          affiliationId,
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setCoverage((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return coverage;
}
