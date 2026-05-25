import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Shell } from "./components/Shell/Shell";
import { AgendaPage } from "./pages/AgendaPage";
import { PatientPage } from "./pages/PatientPage";
import { PatientsPage } from "./pages/PatientsPage";
import { PageTitleProvider } from "./context/PageTitleContext";
import { SplashScreen } from "./components/SplashScreen/SplashScreen";
import { Activity } from "lucide-react";

const SPLASH_KEY = "signal_splash_shown";

export default function App() {
  const [state, setState] = useState<"start" | "splash" | "main">(() => {
    return sessionStorage.getItem(SPLASH_KEY) ? "main" : "start";
  });

  function handleStart() {
    setState("splash");
  }

  function handleSplashDone() {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setState("main");
  }

  if (state === "start") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#F0F4F4" }}
      >
        <button
          onClick={handleStart}
          className="group flex flex-col items-center gap-4 focus:outline-none"
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center border transition-all duration-500 group-hover:scale-110"
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <Activity size={22} style={{ color: "#1F5C5E" }} />
          </div>
          <span
            className="text-[11px] tracking-widest uppercase font-medium"
            style={{ color: "#1F5C5E" }}
          >
            Start Signal Preparation
          </span>
        </button>
      </div>
    );
  }

  if (state === "splash") {
    return <SplashScreen onDone={handleSplashDone} />;
  }

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
