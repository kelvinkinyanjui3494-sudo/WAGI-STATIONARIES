const API_URL =
  import.meta.env["VITE_API_URL"] || "http://127.0.0.1:8000/api";

type ApiOptions = RequestInit & {
  token?: string | null;
};

function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("wagi_auth_token");
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...fetchOptions } = options;

  const finalHeaders = new Headers(headers);

  finalHeaders.set("Accept", "application/json");

  if (fetchOptions.body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const authToken = token ?? getStoredAuthToken();

  if (authToken) {
    finalHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: finalHeaders,
  });

  let data: unknown = null;

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data as T;
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("wagi_auth_token", token);
}

export function getAuthToken(): string | null {
  return getStoredAuthToken();
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("wagi_auth_token");
}

