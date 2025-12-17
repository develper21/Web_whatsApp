import { create } from "zustand";
import api, { setAuthToken } from "../lib/apiClient";
import { useChatStore } from "./chatStore";
import { useNotificationStore } from "./notificationStore";
import {
  isCryptoAvailable,
  generateEncryptionKeyPair,
  storePrivateKey,
  loadStoredPrivateKey,
  clearStoredPrivateKey,
} from "../lib/cryptoUtils";

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
const persistedPrivateKey = loadStoredPrivateKey();

export const useAuthStore = create((set, get) => ({
  user: persisted.user || null,
  accessToken: persisted.accessToken || "",
  refreshToken: persisted.refreshToken || "",
  loading: false,
  error: null,
  profileUpdating: false,
  encryptionPublicKey: persisted.user?.encryptionPublicKey || null,
  encryptionPrivateKey: persistedPrivateKey,

  ensureEncryptionKeys: async () => {
    if (!isCryptoAvailable()) return;
    const {
      user,
      encryptionPublicKey,
      encryptionPrivateKey,
      accessToken,
      refreshToken,
    } = get();

    if (!user) return;

    const storedPrivateKey = encryptionPrivateKey || loadStoredPrivateKey();
    const storedPublicKey = encryptionPublicKey || user.encryptionPublicKey;

    if (storedPrivateKey && storedPublicKey) {
      set({
        encryptionPrivateKey: storedPrivateKey,
        encryptionPublicKey: storedPublicKey,
      });
      return;
    }

    try {
      const keyPair = await generateEncryptionKeyPair();
      if (!keyPair?.publicKeyBase64 || !keyPair.privateKeyBase64) return;

      storePrivateKey(keyPair.privateKeyBase64);

      let updatedUser = user;
      try {
        const { data } = await api.put("/users/me", {
          encryptionPublicKey: keyPair.publicKeyBase64,
        });
        updatedUser = data;
        persistUser(data, { accessToken, refreshToken });
      } catch (syncError) {
        console.error("Failed to sync encryption public key", syncError);
      }

      set({
        user: updatedUser,
        encryptionPublicKey: keyPair.publicKeyBase64,
        encryptionPrivateKey: keyPair.privateKeyBase64,
      });
    } catch (error) {
      console.error("Failed to ensure encryption key pair", error);
    }
  },

  clearEncryptionKeys: () => {
    clearStoredPrivateKey();
    set({ encryptionPublicKey: null, encryptionPrivateKey: null });
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      let keyPair = null;
      if (isCryptoAvailable()) {
        try {
          keyPair = await generateEncryptionKeyPair();
        } catch (error) {
          console.error("Failed to generate encryption key pair during registration", error);
        }
      }

      const registrationPayload = {
        ...payload,
        ...(keyPair?.publicKeyBase64
          ? { encryptionPublicKey: keyPair.publicKeyBase64 }
          : {}),
      };

      const { data } = await api.post("/auth/register", registrationPayload);
      persistUser(data.user, data);
      setAuthToken(data.accessToken);
      if (keyPair?.privateKeyBase64) {
        storePrivateKey(keyPair.privateKeyBase64);
      }

      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loading: false,
        encryptionPublicKey:
          data.user.encryptionPublicKey || keyPair?.publicKeyBase64 || null,
        encryptionPrivateKey: keyPair?.privateKeyBase64 || loadStoredPrivateKey(),
      });
      
      useNotificationStore.getState().showSuccess(
        `Welcome to AlgoChat, ${data.user.name}! Your account has been created successfully.`,
        { description: "You can now start chatting with your friends." }
      );
      
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed";
      set({
        error: errorMessage,
        loading: false,
      });
      
      useNotificationStore.getState().showError(
        "Registration Failed",
        { description: errorMessage }
      );
      
      throw error;
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", payload);
      persistUser(data.user, data);
      setAuthToken(data.accessToken);
      const storedPrivateKey = loadStoredPrivateKey();
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loading: false,
        encryptionPublicKey: data.user.encryptionPublicKey || null,
        encryptionPrivateKey: storedPrivateKey,
      });
      await get().ensureEncryptionKeys();
      
      useNotificationStore.getState().showSuccess(
        `Welcome back, ${data.user.name}! You have logged in successfully.`,
        { description: "Your chat sessions are now available." }
      );
      
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      set({
        error: errorMessage,
        loading: false,
      });
      
      useNotificationStore.getState().showError(
        "Login Failed",
        { description: errorMessage }
      );
      
      throw error;
    }
  },

  logout: () => {
    const userName = get().user?.name;
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("algonive-auth");
    }
    setAuthToken("");
    useChatStore.getState().reset();
    get().clearEncryptionKeys();
    set({ user: null, accessToken: "", refreshToken: "" });
    
    useNotificationStore.getState().showInfo(
      "Logged out successfully",
      { description: `Goodbye${userName ? `, ${userName}` : ""}! You have been logged out.` }
    );
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
