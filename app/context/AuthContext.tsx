// AuthContext
// Auth context: manages user, token, logIn/logOut, token refresh and an auth-aware fetch helper.

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { API_BASE } from "../config";

type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // timer to refresh token before it expires
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load token from storage on mount (keeps session across restarts)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (mounted && token) {
          setAccessToken(token);
          // optionally: fetch profile here if you need user data immediately
        }
      } catch (err) {
        console.warn("AuthProvider: failed to load token", err);
      }
    })();

    return () => {
      mounted = false;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // schedule a refresh ms before token expiry (expiresInSeconds from backend)
  const scheduleRefresh = (expiresInSeconds: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);

    // refresh 60s before expiry; ensure we schedule at least 1s from now
    const ms = Math.max(1000, (expiresInSeconds - 60) * 1000);

    refreshTimer.current = setTimeout(async () => {
      try {
        await refreshToken();
      } catch (err) {
        console.warn("AuthProvider: token refresh failed", err);
        // if refresh fails, sign out to avoid leaving user in a broken state
        await signOut();
      }
    }, ms);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setUser(json.data.user);
        setAccessToken(json.data.access_token);
        await AsyncStorage.setItem("token", json.data.access_token);
        scheduleRefresh(json.data.expires_in ?? 3600);

        // navigate to main app after successful login
        setTimeout(() => router.replace("/main_menu"), 0);
        return { success: true };
      }

      return { success: false, message: json.message || "Login failed" };
    } catch (err) {
      console.warn("AuthProvider.signIn error", err);
      return { success: false, message: "Network error" };
    }
  };

  const refreshToken = async () => {
    if (!accessToken) throw new Error("No access token to refresh");

    // call refresh endpoint with current token
    const res = await fetch(`${API_BASE}/refresh`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Token refresh failed");

    const json = await res.json();
    if (json.success && json.data?.access_token) {
      setAccessToken(json.data.access_token);
      await AsyncStorage.setItem("token", json.data.access_token);
      scheduleRefresh(json.data.expires_in ?? 3600);
      return true;
    }

    throw new Error("Refresh returned invalid response");
  };

  const signOut = async () => {
    try {
      // attempt backend logout but don't block local cleanup if it fails
      if (accessToken) {
        try {
          await fetch(`${API_BASE}/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          });
        } catch (e) {
          // ignore network errors on logout call
        }
      }
    } catch (e) {
      console.warn("AuthProvider.signOut (logout) error", e);
    }

    // local cleanup
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setUser(null);
    setAccessToken(null);
    try {
      await AsyncStorage.removeItem("token");
    } catch (err) {
      console.warn("AuthProvider: failed to remove token from storage", err);
    }

    // navigate to login screen (run on next tick to avoid race during mount)
    setTimeout(() => {
      try {
        router.replace("/"); // root/login
      } catch (err) {
        console.warn("AuthProvider: router.replace failed during signOut", err);
      }
    }, 0);
  };

  /**
   * authFetch: wrapper around fetch that injects Authorization header.
   * - On 401 it will attempt one token refresh then retry the request once.
   * - If refresh fails, it signs the user out.
   */
  const authFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const baseHeaders = { "Content-Type": "application/json" } as Record<string, string>;
    const incomingHeaders = (init?.headers as Record<string, string>) || {};
    const headers = { ...baseHeaders, ...incomingHeaders };

    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let res = await fetch(input, { ...init, headers });

    if (res.status !== 401) return res;

    // if 401, try to refresh token once and retry the original request
    try {
      await refreshToken();
      // use the newly set accessToken for the retry
      const retryHeaders = { ...baseHeaders, ...(init?.headers as Record<string, string>), Authorization: `Bearer ${accessToken}` };
      return fetch(input, { ...init, headers: retryHeaders });
    } catch (err) {
      // refresh failed -> force sign out
      await signOut();
      throw new Error("Unauthorized");
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, signIn, signOut, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};
