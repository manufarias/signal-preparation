import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fhirClient } from "../../api/fhir";

const COMMON_MEDICATIONS = [
  {
    display: "Omeprazole 20 MG Oral Capsule",
    code: "402014",
    dose: "20 MG",
    form: "Oral Capsule",
  },
  {
    display: "Lisinopril 10 MG Oral Tablet",
    code: "314076",
    dose: "10 MG",
    form: "Oral Tablet",
  },
  {
    display: "Metformin 500 MG Oral Tablet",
    code: "861007",
    dose: "500 MG",
    form: "Oral Tablet",
  },
  {
    display: "Atorvastatin 20 MG Oral Tablet",
    code: "429503",
    dose: "20 MG",
    form: "Oral Tablet",
  },
  {
    display: "Amlodipine 5 MG Oral Tablet",
    code: "197380",
    dose: "5 MG",
    form: "Oral Tablet",
  },
  {
    display: "Levothyroxine 50 MCG Oral Tablet",
    code: "966222",
    dose: "50 MCG",
    form: "Oral Tablet",
  },
  {
    display: "Salbutamol 100 MCG Inhaler",
    code: "307782",
    dose: "100 MCG",
    form: "Inhaler",
  },
  {
    display: "Ibuprofen 400 MG Oral Tablet",
    code: "310965",
    dose: "400 MG",
    form: "Oral Tablet",
  },
  {
    display: "Metoprolol 50 MG Oral Tablet",
    code: "866514",
    dose: "50 MG",
    form: "Oral Tablet",
  },
  {
    display: "Losartan 50 MG Oral Tablet",
    code: "979480",
    dose: "50 MG",
    form: "Oral Tablet",
  },
  {
    display: "Sertraline 50 MG Oral Tablet",
    code: "312938",
    dose: "50 MG",
    form: "Oral Tablet",
  },
  {
    display: "Pantoprazole 40 MG Oral Tablet",
    code: "1149649",
    dose: "40 MG",
    form: "Oral Tablet",
  },
  {
    display: "Amoxicillin 500 MG Oral Capsule",
    code: "723372",
    dose: "500 MG",
    form: "Oral Capsule",
  },
  {
    display: "Furosemide 40 MG Oral Tablet",
    code: "313988",
    dose: "40 MG",
    form: "Oral Tablet",
  },
  {
    display: "Alprazolam 0.5 MG Oral Tablet",
    code: "308047",
    dose: "0.5 MG",
    form: "Oral Tablet",
  },
];

interface Props {
  open: boolean;
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MedicationDrawer({
  open,
  patientId,
  onClose,
  onSuccess,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState("");
  const [dosage, setDosage] = useState("");

  useEffect(() => {
    if (open) {
      setVisible(true);
      setSelectedMed("");
      setDosage("");
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
    if (!selectedMed) {
      setError("Please select a medication");
      return;
    }
    setSubmitting(true);
    setError(null);

    const med = COMMON_MEDICATIONS.find((m) => m.code === selectedMed)!;

    try {
      await fhirClient.post("/MedicationRequest", {
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: med.code,
              display: med.display,
            },
          ],
          text: med.display,
        },
        subject: { reference: `Patient/${patientId}` },
        authoredOn: new Date().toISOString(),
        ...(dosage ? { dosageInstruction: [{ text: dosage }] } : {}),
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
            Add medication
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
              Medication <span style={{ color: "#A32D2D" }}>*</span>
            </label>
            <select
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            >
              <option value="">Select a medication…</option>
              {COMMON_MEDICATIONS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.display}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary">
              Dosage instructions{" "}
              <span className="text-sp-text-secondary font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Take 1 tablet daily with food"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
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
            {submitting ? "Saving…" : "Add medication"}
          </button>
        </div>
      </div>
    </>
  );
}
