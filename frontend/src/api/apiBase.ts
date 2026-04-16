import { frontConfig } from "../frontConfig";

export function getApiBase() {
  return (
    (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ??
    frontConfig.apiServer
  );
}
