import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────
// REQUEST INTERCEPTOR
// Automatically attach access token to every request
// ─────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR
// If access token expired (401) → try refresh token
// If refresh fails → clear storage and redirect to login
// ─────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 and only retry once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token } = response.data;

          // Store new tokens
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", refresh_token);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed — clear everything and redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token — redirect to login
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;