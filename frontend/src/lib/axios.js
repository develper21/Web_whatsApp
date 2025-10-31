import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://web-whatsapp-qjq4.onrender.com/api" : "/api",
  withCredentials: true,
});
