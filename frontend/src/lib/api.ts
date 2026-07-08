export const API_BASE_URL = typeof window !== "undefined"
  ? window.location.origin
  : "http://127.0.0.1:8000";

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}): Promise<any> {
  const { skipAuth, ...fetchOptions } = options;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}/api/v1${path}`;
  
  // Set default content type
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Access Token if available
  if (!skipAuth && typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  fetchOptions.headers = headers;
  
  const response = await fetch(url, fetchOptions);

  if (response.status === 401 && !skipAuth && typeof window !== "undefined") {
    // Attempt Token Refresh
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      handleAuthFailure();
      throw new Error("Unauthorized");
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          isRefreshing = false;
          onRefreshed(data.access_token);
        } else {
          isRefreshing = false;
          handleAuthFailure();
          throw new Error("Unauthorized");
        }
      } catch (err) {
        isRefreshing = false;
        handleAuthFailure();
        throw new Error("Unauthorized");
      }
    }

    // Wait for refresh to complete
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        headers.set("Authorization", `Bearer ${newToken}`);
        resolve(fetch(url, fetchOptions).then((res) => {
          if (!res.ok) throw new Error("API Request Failed");
          return res.json();
        }));
      });
    });
  }

  if (response.status === 244 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "API Request Failed");
  }

  return response.json();
}

function handleAuthFailure() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_profile");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
}
