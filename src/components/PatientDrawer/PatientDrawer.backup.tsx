import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { patientApi } from "../../api/fhir";
import { useState } from "react";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
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
      onClose();
    } catch {
      setServerError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[400px] sm:max-w-[400px] bg-sp-surface p-6 flex flex-col gap-6"
      >
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar paciente" : "Nuevo paciente"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-sp-text-primary">
              Nombre
            </label>
            <input
              {...register("given", { required: "El nombre es requerido" })}
              placeholder="Manuel"
              className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            />
            {errors.given && (
              <p className="text-[12px] text-red-500">{errors.given.message}</p>
            )}
          </div>

          {/* Apellido */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-sp-text-primary">
              Apellido
            </label>
            <input
              {...register("family", { required: "El apellido es requerido" })}
              placeholder="Farías"
              className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            />
            {errors.family && (
              <p className="text-[12px] text-red-500">
                {errors.family.message}
              </p>
            )}
          </div>

          {/* Género */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-sp-text-primary">
              Género
            </label>
            <select
              {...register("gender", { required: "El género es requerido" })}
              className="w-full px-3 py-2.5 text-[14px] bg-sp-bg border border-sp-border rounded-lg outline-none focus:border-sp-primary transition-colors"
            >
              <option value="">Seleccioná una opción</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
              <option value="unknown">Desconocido</option>
            </select>
            {errors.gender && (
              <p className="text-[12px] text-red-500">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-sp-text-primary">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              {...register("birthDate", {
                required: "La fecha es requerida",
                validate: (v) =>
                  new Date(v) <= new Date() || "La fecha no puede ser futura",
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

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-[14px] font-medium border border-sp-border rounded-lg hover:bg-sp-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-[14px] font-medium bg-sp-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear paciente"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
