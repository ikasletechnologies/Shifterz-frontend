import { apiCall } from "@/services/api.client";

export async function login(username: string, password: string) {
  const response = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  // Phase 0.10 — the backend already set the auth token as an httpOnly
  // cookie on this response; it is never written to localStorage or a
  // JS-readable cookie here. Only non-sensitive display data is kept
  // locally for the UI (name/role/franchise), not the credential itself.
  if (typeof window !== "undefined" && response.user) {
    localStorage.setItem("user", JSON.stringify(response.user));
  }

  return response;
}

export async function logout() {
  try {
    await apiCall("/auth/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  }
}
