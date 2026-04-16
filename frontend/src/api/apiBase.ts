// export const REMOTE_API_BASE = "http://120.78.3.29:8888/api/pss";
export const REMOTE_API_BASE = "http://127.0.0.1:3000";

export function getApiBase() {
  return (
    (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ??
    REMOTE_API_BASE
  );
}
