//api.ts
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "../config";

// --- Demo login creds from the doc ---
const DEMO_EMAIL = "trainee@astiro-systems.com";
const DEMO_PASSWORD = "Astiro@2025";

// --- Storage Keys ---
const KEY_ACCESS_TOKEN = "access_token";
const KEY_TOKEN_EXP = "access_token_exp";

// ====== Types ======
export type MediaProduct = {
  product_code: string;
  product_desc: string;
  is_locked?: any;
};

// ====== Token handling ======
async function setToken(token: string, expiresInSeconds: number) {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = nowSec + (expiresInSeconds || 3600);
  await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, token);
  await SecureStore.setItemAsync(KEY_TOKEN_EXP, String(exp));
}

async function getStoredToken(): Promise<{ token: string | null; exp: number }> {
  const token = await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
  const expStr = await SecureStore.getItemAsync(KEY_TOKEN_EXP);
  const exp = expStr ? parseInt(expStr, 10) : 0;
  return { token, exp };
}

function isExpired(exp: number): boolean {
  if (!exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= exp - 60; // refresh 60s early
}

// ====== Small fetch helper with timeout ======
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ====== API Login / Refresh ======
export async function loginWithDemoCreds(): Promise<string> {
  const res = await fetchWithTimeout(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });

  const json = await res.json();
  if (!res.ok || json.failed || !json?.data?.access_token) {
    throw new Error(json?.message || "Login failed");
  }

  const token = json.data.access_token;
  const expiresIn = json.data.expires_in ?? 3600;
  await setToken(token, expiresIn);
  return token;
}

export async function refreshToken(): Promise<string> {
  const { token: current } = await getStoredToken();
  if (!current) throw new Error("No token to refresh");

  const res = await fetchWithTimeout(`${API_BASE}/refresh`, {
    method: "GET",
    headers: { Authorization: `Bearer ${current}` },
  });

  const json = await res.json();
  if (!res.ok || json.failed || !json?.data?.access_token) {
    throw new Error(json?.message || "Refresh failed");
  }

  const token = json.data.access_token;
  const expiresIn = json.data.expires_in ?? 3600;
  await setToken(token, expiresIn);
  return token;
}

// Returns a valid token (auto-login if missing)
export async function getAccessToken(): Promise<string> {
  const { token, exp } = await getStoredToken();

  if (!token) {
    return await loginWithDemoCreds();
  }

  if (isExpired(exp)) {
    try {
      return await refreshToken();
    } catch {
      return await loginWithDemoCreds();
    }
  }

  return token;
}

// ====== Master Data: MediaProduct ======
export async function fetchMediaProducts(): Promise<MediaProduct[]> {
  const token = await getAccessToken();

  const res = await fetchWithTimeout(`${API_BASE}/fetch-master-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ masters: ["MediaProduct"] }),
  });

  const json = await res.json();
  if (!res.ok || json?.failed) {
    throw new Error(json?.message || "Failed to fetch Media Products");
  }

  const list: MediaProduct[] = json?.data?.MediaProduct ?? [];
  return list;
}
