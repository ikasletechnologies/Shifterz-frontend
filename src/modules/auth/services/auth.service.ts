import { apiCall } from "@/services/api.client";

export async function login(username: string, password: string) {
  const response = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  
  if (response.token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", response.token);
      // Also set the token in cookies so that Next.js middleware can read it
      document.cookie = `token=${response.token}; path=/; max-age=86400; SameSite=Strict`;
      
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
    }
  }
  
  return response;
}
