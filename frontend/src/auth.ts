const TOKEN_KEY = "user_token";
const USER_PROFILE_KEY = "user_profile";

export type AuthUserProfile = {
  name: string;
  username: string;
};

function parseTokenPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[0];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

/** 从 localStorage 读取 token，如已过期自动清除并返回 null */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const payload = parseTokenPayload(token);
  if (!payload) {
    clearToken();
    return null;
  }

  if (typeof payload.exp === "number" && Date.now() > payload.exp) {
    clearToken();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthUserProfile(): AuthUserProfile | null {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUserProfile>;
    if (typeof parsed.name !== "string" || typeof parsed.username !== "string") {
      localStorage.removeItem(USER_PROFILE_KEY);
      return null;
    }
    return {
      name: parsed.name,
      username: parsed.username,
    };
  } catch {
    localStorage.removeItem(USER_PROFILE_KEY);
    return null;
  }
}

export function setAuthUserProfile(profile: AuthUserProfile): void {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
