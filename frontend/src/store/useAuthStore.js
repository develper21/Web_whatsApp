import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const socketBaseUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5001" : "/");

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isRequestingOtp: false,
  isVerifyingOtp: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  requestOtp: async (phoneNumber) => {
    set({ isRequestingOtp: true });
    try {
      await axiosInstance.post("/auth/request-otp", { phoneNumber });
      toast.success("OTP sent successfully");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      set({ isRequestingOtp: false });
    }
  },

  verifyOtp: async (payload) => {
    set({ isVerifyingOtp: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", payload);
      set({ authUser: res.data });
      toast.success("Authentication successful");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      set({ isVerifyingOtp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(getErrorMessage(error));
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(socketBaseUrl, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
