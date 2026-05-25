const TOKEN_KEY = "fi_token";

export type JwtPayload = {
  sub: string;
  role: string;
  shelter_id?: number | null;
  exp?: number;
};

export function parseJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return json as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const p = parseJwt(token);
  if (!p?.exp) return false;
  return Date.now() >= p.exp * 1000;
}

/** Sesión de panel válida (token presente y no caducado). */
export function hasValidSession(): boolean {
  return getToken() !== null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearToken();
    return null;
  }
  return token;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
