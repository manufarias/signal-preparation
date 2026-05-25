import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fhirClient } from "../../api/fhir";

const VITAL_TYPES = [
  {
    display: "Blood pressure",
    code: "55284-4",
    unit: "mmHg",
    placeholder: "e.g. 120/80",
    isBloodPressure: true,
  },
  {
    display: "Heart rate",
    code: "8867-4",
    unit: "/min",
    placeholder: "e.g. 72",
  },
  {
    display: "Body weight",
    code: "29463-7",
    unit: "kg",
    placeholder: "e.g. 70",
  },
  {
    display: "Body height",
    code: "8302-2",
    unit: "cm",
    placeholder: "e.g. 170",
  },
  { display: "BMI", code: "39156-5", unit: "kg/m2", placeholder: "e.g. 24.5" },
  {
    display: "Body temperature",
    code: "8310-5",
    unit: "Cel",
    placeholder: "e.g. 36.8",
  },
  {
    display: "Respiratory rate",
    code: "9279-1",
    unit: "/min",
    placeholder: "e.g. 16",
  },
  {
    display: "Pain severity",
    code: "72514-3",
    unit: "{score}",
    placeholder: "0-10",
  },
];

interface Props {
  open: boolean;
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function VitalSignDrawer({
  open,
  patientId,
  onClose,
  onSuccess,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVital, setSelectedVital] = useState("");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");

  const vital = VITAL_TYPES.find((v) => v.code === selectedVital);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setSelectedVital("");
      setValue("");
      setSystolic("");
      setDiastolic("");
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
    if (!selectedVital) {
      setError("Please select a vital sign");
      return;
    }
    if (vital?.isBloodPressure && (!systolic || !diastolic)) {
      setError("Please enter both systolic and diastolic values");
      return;
    }
    if (!vital?.isBloodPressure && !value) {
      setError("Please enter a value");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      const observation: any = {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: vital!.code,
              display: vital!.display,
            },
          ],
          text: vital!.display,
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: now,
      };

      if (vital?.isBloodPressure) {
        observation.component = [
          {
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8480-6",
                  display: "Systolic blood pressure",
                },
              ],
            },
            valueQuantity: {
              value: parseFloat(systolic),
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]",
            },
          },
          {
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8462-4",
                  display: "Diastolic blood pressure",
                },
              ],
            },
            valueQuantity: {
              value: parseFloat(diastolic),
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]",
            },
          },
        ];
      } else {
        observation.valueQuantity = {
          value: parseFloat(value),
          unit: vital!.unit,
          system: "http://unitsofmeasure.org",
        };
      }

      await fhirClient.post("/Observation", observation);
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
            Record vital sign
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
              Vital sign <span style={{ color: "#A32D2D" }}>*</span>
            </label>
            <select
              value={selectedVital}
              onChange={(e) => {
                setSelectedVital(e.target.value);
                setValue("");
                setSystolic("");
                setDiastolic("");
              }}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            >
              <option value="">Select a vital sign…</option>
              {VITAL_TYPES.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.display}
                </option>
              ))}
            </select>
          </div>

          {vital && (
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-sp-text-primary">
                Value <span style={{ color: "#A32D2D" }}>*</span>
                <span className="ml-1 text-sp-text-secondary font-normal">
                  ({vital.unit})
                </span>
              </label>
              {vital.isBloodPressure ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Systolic"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
                  />
                  <span className="text-sp-text-secondary font-medium">/</span>
                  <input
                    type="number"
                    placeholder="Diastolic"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
                  />
                </div>
              ) : (
                <input
                  type="number"
                  placeholder={vital.placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
                />
              )}
            </div>
          )}

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
            {submitting ? "Saving…" : "Record vital sign"}
          </button>
        </div>
      </div>
    </>
  );
}
