import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui/PageLoader";
import { ToastContainer } from "./components/ui/Toast";

// Lazy-loaded components
const HomePage = lazy(() =>
  import("@pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const LoginPage = lazy(() =>
  import("@pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const AuthCallbackPage = lazy(() =>
  import("@pages/AuthCallbackPage").then((m) => ({
    default: m.AuthCallbackPage,
  })),
);
const ChatPage = lazy(() =>
  import("@pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const ResumePage = lazy(() =>
  import("@pages/ResumePage").then((m) => ({ default: m.ResumePage })),
);
const JobsPage = lazy(() =>
  import("@pages/JobsPage").then((m) => ({ default: m.JobsPage })),
);
const PricingPage = lazy(() =>
  import("@pages/PricingPage").then((m) => ({ default: m.PricingPage })),
);
const DiscordSettingsPage = lazy(() =>
  import("@pages/DiscordSettingsPage").then((m) => ({
    default: m.DiscordSettingsPage,
  })),
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/login/callback" element={<AuthCallbackPage />} />
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
            path="chat/:id"
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
          <Route
            path="discord-settings"
            element={
              <ProtectedRoute>
                <DiscordSettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
