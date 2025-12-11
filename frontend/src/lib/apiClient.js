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
