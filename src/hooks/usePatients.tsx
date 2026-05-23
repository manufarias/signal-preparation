import { useCallback, useEffect, useState } from "react";
import fhirClient from "../api/fhir";

export interface Patient {
  id: string;
  name: { use: string; family: string; given: string[] }[];
  gender: string;
  birthDate: string;
  identifier?: { type?: { coding?: { code?: string }[] }; value?: string }[];
}

function usePatients(search: string = "") {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // NUEVO: fetchPatients es una función reutilizable
  // useCallback evita que se recree en cada render
  const fetchPatients = useCallback(() => {
    setLoading(true);

    const query = search.trim()
      ? `/Patient?name=${encodeURIComponent(search.trim())}&_count=50`
      : "/Patient?_count=50";

    fhirClient
      .get(query)
      .then((response) => {
        const entries = response.data.entry ?? [];
        setPatients(entries.map((e: { resource: Patient }) => e.resource));
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err : new Error("Error loading patients"),
        ),
      )
      .finally(() => setLoading(false));
  }, [search]);

  // Se ejecuta cuando cambia `search` o cuando se llama refetch
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // NUEVO: refetch expuesto para que los componentes lo llamen
  return { patients, loading, error, refetch: fetchPatients };
}

export default usePatients;
