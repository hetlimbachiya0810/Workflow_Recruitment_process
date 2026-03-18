import axiosInstance from "./axiosInstance";

export const authApi = {
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return response.data;
  },

  me: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },
};
