import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { HomePage } from "@pages/HomePage";
import { LoginPage } from "@pages/LoginPage";
import { RegisterPage } from "@pages/RegisterPage";
import { AuthCallbackPage } from "@pages/AuthCallbackPage";
import { ChatPage } from "@pages/ChatPage";
import { ResumePage } from "@pages/ResumePage";
import { JobsPage } from "@pages/JobsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastContainer } from "./components/ui/Toast";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route
          path="chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="resume"
          element={
            <ProtectedRoute>
              <ResumePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="jobs"
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
