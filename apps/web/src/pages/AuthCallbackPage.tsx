import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { apiClient } from "../lib/api-client";
import { User } from "../types/auth";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get("access_token");
      const error = searchParams.get("error");

      if (error) {
        console.error("Auth error:", error);
        navigate("/login?error=" + encodeURIComponent(error));
        return;
      }

      if (token) {
        try {
          // Store token temporarily to fetch profile
          localStorage.setItem("access_token", token);

          // Fetch user profile to ensure token is valid and get user details
          const response = await apiClient.get<{ data: User }>(
            "/users/profile",
          );

          if (response.data.data) {
            setAuth(response.data.data, token);
            navigate("/chat");
          } else {
            throw new Error("Failed to fetch profile");
          }
        } catch (err) {
          console.error("Callback processing failed:", err);
          navigate("/login?error=processing_failed");
        }
      } else {
        navigate("/login");
      }
    };

    processCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Authenticating...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  );
}
