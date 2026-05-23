import { useForm } from "react-hook-form";
import { patientApi } from "../../api/fhir";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface PatientFormData {
  given: string;
  family: string;
  gender: string;
  birthDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: {
    id: string;
    given: string;
    family: string;
    gender: string;
    birthDate: string;
  };
}

export function PatientDrawer({ open, onClose, onSuccess, patient }: Props) {
  const isEditing = !!patient;
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // NUEVO: anima la salida antes de desmontar
  function handleClose() {
    reset();
    onClose();
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    mode: "onChange",
    defaultValues: patient ?? {
      given: "",
      family: "",
      gender: "",
      birthDate: "",
    },
  });

  async function onSubmit(data: PatientFormData) {
    setSubmitting(true);
    setServerError(null);
    try {
      if (isEditing && patient) {
        await patientApi.update(patient.id, data);
      } else {
        await patientApi.create(data);
      }
      reset();
      onSuccess();
      handleClose();
    } catch {
      setServerError("Error saving. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Montado mientras open O mientras visible (durante animación de salida)
  if (!open && !visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-500"
        style={{ backgroundColor: "rgba(0,0,0,0.2)", opacity: open ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Drawer */}
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          <span className="text-[15px] font-medium text-sp-text-primary">
            {isEditing ? "Edit patient" : "New patient"}
          </span>
          <button
            onClick={handleClose}
            className="text-sp-text-secondary hover:text-sp-text-primary transition-colors p-1 rounded hover:bg-sp-bg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-sp-text-primary">
                First name
              </label>
              <input
                {...register("given", { required: "First name is required" })}
                autoFocus
                className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
              />
              {errors.given && (
                <p className="text-[12px] text-red-500">
                  {errors.given.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-sp-text-primary">
                Last name
              </label>
              <input
                {...register("family", {
                  required: "Last name is required",
                })}
                className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
              />
              {errors.family && (
                <p className="text-[12px] text-red-500">
                  {errors.family.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-sp-text-primary">
                Gender
              </label>
              <select
                {...register("gender", { required: "Gender is required" })}
                className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
              >
                <option value="">Select an option</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
              {errors.gender && (
                <p className="text-[12px] text-red-500">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-sp-text-primary">
                Date of birth
              </label>
              <input
                type="date"
                {...register("birthDate", {
                  required: "Date is required",
                  validate: (v) =>
                    new Date(v) <= new Date() || "Date cannot be in the future",
                })}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
              />
              {errors.birthDate && (
                <p className="text-[12px] text-red-500">
                  {errors.birthDate.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-[13px] text-red-500">{serverError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-[14px] font-medium border border-sp-border rounded-lg hover:bg-sp-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-[14px] font-medium bg-sp-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting
                  ? "Saving…"
                  : isEditing
                    ? "Save changes"
                    : "Create patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
