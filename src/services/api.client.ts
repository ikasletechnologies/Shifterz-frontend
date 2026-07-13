/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`);
  if (isGet) {
    url.searchParams.append('_t', Date.now().toString());
  }

  let finalOptions = { ...options };

  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (finalOptions.method && ["POST", "PUT"].includes(finalOptions.method.toUpperCase()) && finalOptions.body) {
          const bodyObj = JSON.parse(finalOptions.body as string);
          if (finalOptions.method.toUpperCase() === "POST" && !bodyObj.createdBy) {
            bodyObj.createdBy = user.name || user.username;
          }
          if (finalOptions.method.toUpperCase() === "PUT" && !bodyObj.modifiedBy) {
            bodyObj.modifiedBy = user.name || user.username;
          }
          finalOptions.body = JSON.stringify(bodyObj);
        }
      } catch (e) {
        console.error("Error adding audit fields:", e);
      }
    }
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    ...finalOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...finalOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

