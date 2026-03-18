import { useCallback } from "react";
import useAuthStore from "../store/authStore";
import { authApi } from "../api/authApi";

const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setTokens,
    setUser,
    setLoading,
    setError,
    clearError,
    logout,
    getRole,
    isAdmin,
    isRecruiter,
    isVendor,
    isClient,
  } = useAuthStore();

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      clearError();
      try {
        // Step 1 — Get tokens
        const tokenData = await authApi.login(email, password);
        setTokens(tokenData.access_token, tokenData.refresh_token);

        // Step 2 — Get user profile
        const meData = await authApi.me();
        setUser(meData);

        return meData;
      } catch (err) {
        const message =
          err.response?.data?.detail || "Login failed. Please try again.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, clearError, setTokens, setUser, setError]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    getRole,
    isAdmin,
    isRecruiter,
    isVendor,
    isClient,
  };
};

export default useAuth;