import type { CoverageStatus } from "../hooks/useCoverage";

export function coverageStyle(status: CoverageStatus): {
  background: string;
  color: string;
} {
  switch (status) {
    case "active":
      return { background: "#E1F5EE", color: "#085041" };
    case "expiring":
      return { background: "#FAEEDA", color: "#854F0B" };
    case "expired":
      return { background: "#FCEBEB", color: "#A32D2D" };
    case "not_recorded":
      return { background: "#F3F4F6", color: "#6B7280" };
  }
}
