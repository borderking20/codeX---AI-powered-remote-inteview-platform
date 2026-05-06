import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import HistoryPage from "./pages/HistoryPage";
import ReportPage from "./pages/ReportPage";
import JoinByTokenPage from "./pages/JoinByTokenPage";

function App() {
  const { isSignedIn, isLoaded } = useUser();

  // this will get rid of the flickering effect
  if (!isLoaded) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to={"/"} />} />

        <Route path="/problems" element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />} />
        <Route path="/problem/:id" element={isSignedIn ? <ProblemPage /> : <Navigate to={"/"} />} />
        <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to={"/"} />} />
        
        {/* MOCK INTERVIEW ROUTES */}
        <Route path="/mock-interview" element={isSignedIn ? <MockInterviewPage /> : <Navigate to={"/"} />} />
        <Route path="/mock-interview/session/:id" element={isSignedIn ? <InterviewSessionPage /> : <Navigate to={"/"} />} />
        <Route path="/mock-interview/history" element={isSignedIn ? <HistoryPage /> : <Navigate to={"/"} />} />
        <Route path="/mock-interview/report/:id" element={isSignedIn ? <ReportPage /> : <Navigate to={"/"} />} />

        {/* PRIVATE SESSION INVITE LINK — handled by the page itself (has internal Clerk sign-in) */}
        <Route path="/join/:token" element={<JoinByTokenPage />} />
      </Routes>

      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
