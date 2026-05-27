import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Shell } from "./components/Shell/Shell";
import { AgendaPage } from "./pages/AgendaPage";
import { PatientPage } from "./pages/PatientPage";
import { PatientsPage } from "./pages/PatientsPage";
import { PageTitleProvider } from "./context/PageTitleContext";
import { SplashScreen } from "./components/SplashScreen/SplashScreen";
import { LandingPage } from "./components/LandingPage/LandingPage";
import { Analytics } from "@vercel/analytics/react";

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
    return <LandingPage onStart={handleStart} />;
  }

  if (state === "splash") {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  return (
    <BrowserRouter>
      <PageTitleProvider>
        <Analytics />
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
