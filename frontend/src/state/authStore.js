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
    return JSON.parse(stored);
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
