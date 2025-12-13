import axios from "axios";

let accessToken = "";

export const setAuthToken = (token) => {
  accessToken = token || "";
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { useAuthStore } = await import("../state/authStore");
        const newToken = await useAuthStore.getState().refreshToken();
        accessToken = newToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        const { useAuthStore } = await import("../state/authStore");
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

export const uploadAttachments = async (files = []) => {
  if (!files.length) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await api.post("/messages/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.files || [];
};
