import axiosInstance from "./axiosInstance";

export const userApi = {
  listUsers: async (params = {}) => {
    const response = await axiosInstance.get("/users", { params });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post("/users", userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await axiosInstance.patch(`/users/${userId}`, userData);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  },
};