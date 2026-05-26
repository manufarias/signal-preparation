import axios from "axios";

const fhirClient = axios.create({
  baseURL: import.meta.env.VITE_FHIR_BASE_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_FHIR_TOKEN}`,
    "Content-Type": "application/fhir+json",
  },
});

fhirClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      window.dispatchEvent(new CustomEvent("fhir-network-error"));
    }
    return Promise.reject(error);
  },
);

interface PatientFormData {
  given: string;
  family: string;
  gender: string;
  birthDate: string;
}

function toFHIRPatient(data: PatientFormData) {
  return {
    resourceType: "Patient",
    name: [{ use: "official", family: data.family, given: [data.given] }],
    gender: data.gender,
    birthDate: data.birthDate,
  };
}

export const patientApi = {
  create: (data: PatientFormData) =>
    fhirClient.post("/Patient", toFHIRPatient(data)),

  update: (id: string, data: PatientFormData) =>
    fhirClient.put(`/Patient/${id}`, { ...toFHIRPatient(data), id }),
};

export { fhirClient };
export default fhirClient;
