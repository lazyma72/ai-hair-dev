const TOKEN_KEY = "user_token";

/** 从 localStorage 读取 token，如已过期自动清除并返回 null */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const payload = token.split(".")[0];
    const { exp } = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof exp === "number" && Date.now() > exp) {
      clearToken();
      return null;
    }
  } catch {
    clearToken();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
