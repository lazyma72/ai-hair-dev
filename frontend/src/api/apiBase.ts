import { frontConfig } from "../frontConfig";

export function getApiBase() {
  const envApiBase = (import.meta as { env?: { VITE_API_BASE?: string } }).env
    ?.VITE_API_BASE;
  if (envApiBase) return envApiBase;

  return frontConfig.apiServer;
}
