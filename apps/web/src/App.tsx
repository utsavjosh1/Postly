import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui/PageLoader";
import { ToastContainer } from "./components/ui/Toast";

// ─── Lazy-loaded Transmission pages ─────────────────────────────────
const TransmissionLanding = lazy(() =>
  import("@pages/TransmissionLanding").then((m) => ({
    default: m.TransmissionLanding,
  })),
);
const TransmissionLogin = lazy(() =>
  import("@pages/TransmissionLogin").then((m) => ({
    default: m.TransmissionLogin,
  })),
);
const TransmissionRegister = lazy(() =>
  import("@pages/TransmissionRegister").then((m) => ({
    default: m.TransmissionRegister,
  })),
);
const TransmissionPricing = lazy(() =>
  import("@pages/TransmissionPricing").then((m) => ({
    default: m.TransmissionPricing,
  })),
);
const TransmissionChat = lazy(() =>
  import("@pages/TransmissionChat").then((m) => ({
    default: m.TransmissionChat,
  })),
);
const TransmissionIntegrations = lazy(() =>
  import("@pages/TransmissionIntegrations").then((m) => ({
    default: m.TransmissionIntegrations,
  })),
);
const TransmissionNotFound = lazy(() =>
  import("@pages/TransmissionNotFound").then((m) => ({
    default: m.TransmissionNotFound,
  })),
);

// ─── Auth utilities ─────────────────────────────────────────────────
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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ─── Public ──────────────────────────────────── */}
          <Route path="/" element={<TransmissionLanding />} />
          <Route path="login" element={<TransmissionLogin />} />
          <Route path="register" element={<TransmissionRegister />} />
          <Route path="pricing" element={<TransmissionPricing />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="login/callback" element={<AuthCallbackPage />} />

          {/* ─── Protected ───────────────────────────────── */}
          <Route
            path="chat"
            element={
              <ProtectedRoute>
                <TransmissionChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat/:id"
            element={
              <ProtectedRoute>
                <TransmissionChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="integrations"
            element={
              <ProtectedRoute>
                <TransmissionIntegrations />
              </ProtectedRoute>
            }
          />

          {/* ─── 404 ─────────────────────────────────────── */}
          <Route path="*" element={<TransmissionNotFound />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
