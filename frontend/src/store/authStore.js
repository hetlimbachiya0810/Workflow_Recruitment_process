import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────
  user: JSON.parse(localStorage.getItem("user") || "null"),
  accessToken: localStorage.getItem("access_token") || null,
  refreshToken: localStorage.getItem("refresh_token") || null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,
  error: null,

  // ─────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  logout: () => {
    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    // Reset store state
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // ─────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────

  getRole: () => {
    const user = get().user;
    return user?.role || null;
  },

  isAdmin: () => get().user?.role === "admin",
  isRecruiter: () => get().user?.role === "recruiter",
  isVendor: () => get().user?.role === "vendor",
  isClient: () => get().user?.role === "client",
}));

export default useAuthStore;