import { apiCall } from "@/services/api.client";

export async function login(username: string, password: string) {
  const response = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  
  if (response.token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", response.token);
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
    }
  }
  
  return response;
}
