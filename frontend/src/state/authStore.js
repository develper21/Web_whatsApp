import { create } from "zustand";
import api, { setAuthToken } from "../lib/apiClient";
import { useChatStore } from "./chatStore";

const persistUser = (user, tokens) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "algonive-auth",
    JSON.stringify({
      user,
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
    })
  );
};

const readPersisted = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("algonive-auth");
  if (!stored) return null;
  try {
    const data = JSON.parse(stored);
    // Check if token is expired
    if (data.accessToken) {
      try {
        const tokenPayload = JSON.parse(atob(data.accessToken.split('.')[1]));
        if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
          console.log("Token expired, clearing auth data");
          localStorage.removeItem("algonive-auth");
          return null;
        }
      } catch (e) {
        console.log("Invalid token format, clearing auth data");
        localStorage.removeItem("algonive-auth");
        return null;
      }
    }
    return data;
  } catch {
    return null;
  }
};

const persisted = readPersisted() || {};
setAuthToken(persisted?.accessToken);

export const useAuthStore = create((set, get) => ({
  user: persisted.user || null,
  accessToken: persisted.accessToken || "",
  refreshToken: persisted.refreshToken || "",
  loading: false,
  error: null,
  profileUpdating: false,

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", payload);
      persistUser(data.user, data);
      setAuthToken(data.accessToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loading: false,
      });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Registration failed",
        loading: false,
      });
      throw error;
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", payload);
      persistUser(data.user, data);
      setAuthToken(data.accessToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loading: false,
      });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Login failed",
        loading: false,
      });
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("algonive-auth");
    }
    setAuthToken("");
    useChatStore.getState().reset();
    set({ user: null, accessToken: "", refreshToken: "" });
  },

  refreshToken: async () => {
    const { refreshToken } = get();
    console.log("Attempting to refresh token, refresh token exists:", !!refreshToken);
    
    if (!refreshToken) {
      console.log("No refresh token available, logging out");
      get().logout();
      throw new Error("No refresh token available");
    }

    try {
      console.log("Sending refresh token request");
      const { data } = await api.post("/auth/refresh", { refreshToken });
      console.log("Refresh successful, new tokens received");
      persistUser(data.user, data);
      setAuthToken(data.accessToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data.accessToken;
    } catch (error) {
      console.error("Refresh token failed:", error.response?.data || error.message);
      get().logout();
      throw error;
    }
  },

  updateProfile: async (payload) => {
    set({ profileUpdating: true, error: null });
    try {
      const { data } = await api.put("/users/me", payload);
      const tokens = {
        accessToken: get().accessToken,
        refreshToken: get().refreshToken,
      };
      persistUser(data, tokens);
      set({
        user: data,
        profileUpdating: false,
      });
      return data;
    } catch (error) {
      set({
        profileUpdating: false,
        error: error.response?.data?.message || "Profile update failed",
      });
      throw error;
    }
  },
}));
