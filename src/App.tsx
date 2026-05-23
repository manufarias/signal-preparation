import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Shell } from "./components/Shell/Shell";
import { AgendaPage } from "./pages/AgendaPage";
import { PatientPage } from "./pages/PatientPage";
import { PatientsPage } from "./pages/PatientsPage";
import { PageTitleProvider } from "./context/PageTitleContext";

export default function App() {
  return (
    <BrowserRouter>
      <PageTitleProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<AgendaPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patient/:id" element={<PatientPage />} />
          </Routes>
        </Shell>
      </PageTitleProvider>
    </BrowserRouter>
  );
}
