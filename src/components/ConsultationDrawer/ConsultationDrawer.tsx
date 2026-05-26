import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { fhirClient } from "../../api/fhir";
import type { ConsultationNote } from "../../hooks/useConsultations";
import { sanitizeText } from "../../utils/sanitize";

interface Props {
  open: boolean;
  patientId: string;
  onClose: () => void;
  onSuccess: (compositionId: string) => void;
  amendNote?: ConsultationNote;
}

interface SOAPForm {
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export function ConsultationDrawer({
  open,
  patientId,
  onClose,
  onSuccess,
  amendNote,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SOAPForm>({
    chiefComplaint: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  useEffect(() => {
    if (open) {
      setVisible(true);
      setForm({
        chiefComplaint: amendNote?.chiefComplaint ?? "",
        subjective: amendNote?.subjective ?? "",
        objective: amendNote?.objective ?? "",
        assessment: amendNote?.assessment ?? "",
        plan: amendNote?.plan ?? "",
      });
      setError(null);
    } else {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open, amendNote]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!form.chiefComplaint.trim()) {
      setError("Chief complaint is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Sanitizá todos los campos antes del POST
    const clean = {
      chiefComplaint: sanitizeText(form.chiefComplaint),
      subjective: sanitizeText(form.subjective),
      objective: sanitizeText(form.objective),
      assessment: sanitizeText(form.assessment),
      plan: sanitizeText(form.plan),
    };

    try {
      const now = new Date().toISOString();

      const encounterRes = await fhirClient.post<{ id: string }>("/Encounter", {
        resourceType: "Encounter",
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "Ambulatory",
        },
        subject: { reference: `Patient/${patientId}` },
        period: { start: now, end: now },
        reasonCode: [{ text: clean.chiefComplaint }],
      });

      const encounterId = encounterRes.data.id;

      const composRes = await fhirClient.post<{ id: string }>("/Composition", {
        resourceType: "Composition",
        status: "final",
        type: {
          coding: [
            {
              system: "http://loinc.org",
              code: "11488-4",
              display: "Consult note",
            },
          ],
        },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        date: now,
        title: clean.chiefComplaint,
        author: [{ display: "Signal Prep" }],
        ...(amendNote
          ? {
              relatesTo: [
                {
                  code: "replaces",
                  targetReference: { reference: `Composition/${amendNote.id}` },
                },
              ],
            }
          : {}),
        section: [
          {
            title: "Subjective",
            code: { coding: [{ system: "http://loinc.org", code: "61150-9" }] },
            text: {
              status: "generated",
              div: `<div>${clean.subjective}</div>`,
            },
          },
          {
            title: "Objective",
            code: { coding: [{ system: "http://loinc.org", code: "61149-1" }] },
            text: { status: "generated", div: `<div>${clean.objective}</div>` },
          },
          {
            title: "Assessment",
            code: { coding: [{ system: "http://loinc.org", code: "51847-2" }] },
            text: {
              status: "generated",
              div: `<div>${clean.assessment}</div>`,
            },
          },
          {
            title: "Plan",
            code: { coding: [{ system: "http://loinc.org", code: "18776-5" }] },
            text: { status: "generated", div: `<div>${clean.plan}</div>` },
          },
        ],
      });

      onSuccess(composRes.data.id);
      handleClose();
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
        onClick={handleClose}
      />
      <div
        className="fixed top-2 right-2 bottom-2 w-[520px] z-50 flex flex-col bg-white rounded-lg border border-[#e5e5e5] overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -2px rgba(16,24,40,0.03), 0 12px 16px -4px rgba(16,24,40,0.08)",
          animation: open
            ? "slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            : "slideOutToRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          <div>
            <p className="text-[15px] font-medium text-sp-text-primary">
              {amendNote
                ? "Amend consultation note"
                : "Record consultation note"}
            </p>
            <p className="text-[12px] text-sp-text-secondary mt-0.5">
              SOAP ·{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-sp-text-secondary hover:text-sp-text-primary transition-colors p-1 rounded hover:bg-sp-bg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Chief complaint */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary">
              Chief complaint <span style={{ color: "#A32D2D" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Reason for visit..."
              value={form.chiefComplaint}
              onChange={(e) =>
                setForm((f) => ({ ...f, chiefComplaint: e.target.value }))
              }
              autoFocus
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            />
          </div>

          {/* S */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary flex items-center gap-2">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#1F5C5E" }}
              >
                S
              </span>
              Subjective
            </label>
            <p className="text-[11px] text-sp-text-secondary">
              Patient's description of symptoms, history, and concerns
            </p>
            <textarea
              placeholder="What the patient reports..."
              value={form.subjective}
              onChange={(e) =>
                setForm((f) => ({ ...f, subjective: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors resize-none"
            />
          </div>

          {/* O */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary flex items-center gap-2">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#1F5C5E" }}
              >
                O
              </span>
              Objective
            </label>
            <p className="text-[11px] text-sp-text-secondary">
              Measurable findings — vitals, physical exam, test results
            </p>
            <textarea
              placeholder="Clinical findings..."
              value={form.objective}
              onChange={(e) =>
                setForm((f) => ({ ...f, objective: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors resize-none"
            />
          </div>

          {/* A */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary flex items-center gap-2">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#1F5C5E" }}
              >
                A
              </span>
              Assessment
            </label>
            <p className="text-[11px] text-sp-text-secondary">
              Clinical interpretation and diagnosis
            </p>
            <textarea
              placeholder="Diagnosis or clinical impression..."
              value={form.assessment}
              onChange={(e) =>
                setForm((f) => ({ ...f, assessment: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors resize-none"
            />
          </div>

          {/* P */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-sp-text-primary flex items-center gap-2">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#1F5C5E" }}
              >
                P
              </span>
              Plan
            </label>
            <p className="text-[11px] text-sp-text-secondary">
              Treatment, follow-up, and next steps
            </p>
            <textarea
              placeholder="Treatment plan..."
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 text-[13px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-[12px]" style={{ color: "#A32D2D" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
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
            {submitting
              ? "Saving…"
              : amendNote
                ? "Save amendment"
                : "Save consultation note"}
          </button>
        </div>
      </div>
    </>
  );
}
