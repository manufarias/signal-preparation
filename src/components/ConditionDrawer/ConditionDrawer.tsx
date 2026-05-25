import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fhirClient } from "../../api/fhir";

const COMMON_CONDITIONS = [
  { display: "Hypertension", code: "38341003" },
  { display: "Type 2 diabetes mellitus", code: "44054006" },
  { display: "Hypothyroidism", code: "40930008" },
  { display: "Asthma", code: "195967001" },
  { display: "Chronic obstructive pulmonary disease", code: "13645005" },
  { display: "Hyperlipidemia", code: "55822004" },
  { display: "Obesity", code: "414916001" },
  { display: "Anxiety disorder", code: "197480006" },
  { display: "Major depressive disorder", code: "370143000" },
  { display: "Chronic low back pain", code: "279039007" },
  { display: "Osteoarthritis", code: "396275006" },
  { display: "Gastroesophageal reflux disease", code: "235595009" },
  { display: "Atrial fibrillation", code: "49436004" },
  { display: "Heart failure", code: "84114007" },
  { display: "Chronic kidney disease", code: "709044004" },
];

interface Props {
  open: boolean;
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConditionDrawer({
  open,
  patientId,
  onClose,
  onSuccess,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "confirmed" | "provisional"
  >("confirmed");
  const [onsetDate, setOnsetDate] = useState("");

  useEffect(() => {
    if (open) {
      setVisible(true);
      setSelectedCondition("");
      setVerificationStatus("confirmed");
      setOnsetDate("");
      setError(null);
    } else {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function handleSubmit() {
    if (!selectedCondition) {
      setError("Please select a condition");
      return;
    }
    setSubmitting(true);
    setError(null);

    const condition = COMMON_CONDITIONS.find(
      (c) => c.code === selectedCondition,
    )!;

    try {
      await fhirClient.post("/Condition", {
        resourceType: "Condition",
        clinicalStatus: {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: verificationStatus,
            },
          ],
        },
        category: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "problem-list-item",
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: condition.code,
              display: condition.display,
            },
          ],
          text: condition.display,
        },
        subject: { reference: `Patient/${patientId}` },
        ...(onsetDate ? { onsetDateTime: onsetDate } : {}),
        recordedDate: new Date().toISOString(),
      });
      onSuccess();
      onClose();
    } catch {
      setError("Error saving. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open && !visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-500"
        style={{ backgroundColor: "rgba(0,0,0,0.2)", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className="fixed top-2 right-2 bottom-2 w-[480px] z-50 flex flex-col bg-white rounded-lg border border-[#e5e5e5] overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -2px rgba(16,24,40,0.03), 0 12px 16px -4px rgba(16,24,40,0.08)",
          animation: open
            ? "slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            : "slideOutToRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          <p className="text-[15px] font-medium text-sp-text-primary">
            Add condition
          </p>
          <button
            onClick={onClose}
            className="text-sp-text-secondary hover:text-sp-text-primary transition-colors p-1 rounded hover:bg-sp-bg"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary">
              Condition <span style={{ color: "#A32D2D" }}>*</span>
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            >
              <option value="">Select a condition…</option>
              {COMMON_CONDITIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.display}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary">
              Verification status
            </label>
            <div className="flex gap-2">
              {(["confirmed", "provisional"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setVerificationStatus(s)}
                  className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all capitalize"
                  style={{
                    background:
                      verificationStatus === s ? "#1F5C5E" : "#F3F4F6",
                    color: verificationStatus === s ? "white" : "#6B7280",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary">
              Onset date{" "}
              <span className="text-sp-text-secondary font-normal">
                (optional)
              </span>
            </label>
            <input
              type="date"
              value={onsetDate}
              onChange={(e) => setOnsetDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            />
          </div>

          {error && (
            <p className="text-[12px]" style={{ color: "#A32D2D" }}>
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#e5e5e5] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-sp-border rounded-lg hover:bg-sp-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#1F5C5E" }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Saving…" : "Add condition"}
          </button>
        </div>
      </div>
    </>
  );
}
