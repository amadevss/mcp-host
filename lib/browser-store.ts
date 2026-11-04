"use client";
import { useMemo, useSyncExternalStore } from "react";

export type SavedServer = {
  id: string;
  name: string;
  url: string;
  selected: boolean;
};
const KEY = "mcp-host-clients";
const CHANGED = "mcp-host-servers-changed";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGED, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGED, callback);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(KEY) || "[]";
  } catch {
    return "[]";
  }
};
export function useServers() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => parseServers(raw), [raw]);
}
export function parseServers(raw: string): SavedServer[] {
  try {
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    return values
      .filter(
        (s): s is SavedServer =>
          !!s &&
          typeof s === "object" &&
          typeof s.id === "string" &&
          typeof s.name === "string" &&
          typeof s.url === "string",
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        selected: s.selected !== false,
      }));
  } catch {
    return [];
  }
}
export function saveServers(servers: SavedServer[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(servers));
    window.dispatchEvent(new Event(CHANGED));
  } catch {
    throw new Error(
      "El navegador no permite guardar servidores. Habilita el almacenamiento local.",
    );
  }
}
export function accessHeaders() {
  let token = "";
  try {
    token = sessionStorage.getItem("mcp-host-access") || "";
  } catch {
    /* Storage may be disabled. */
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-host-token": token } : {}),
  };
}
export const hostFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...accessHeaders(),
      ...Object.fromEntries(new Headers(init?.headers)),
    },
  });
  if (!response.ok) {
    const result = await response
      .clone()
      .json()
      .catch(() => ({}));
    throw new Error(result.error || `Solicitud fallida (${response.status}).`);
  }
  return response;
};
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await hostFetch(
    path,
    body === undefined
      ? { cache: "no-store" }
      : { method: "POST", body: JSON.stringify(body) },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "No se pudo completar la solicitud.");
  return result as T;
}
export type HostConfig = {
  localUrl: string;
  allowedUrls: string[];
  chatConfigured: boolean;
  accessRequired: boolean;
};
