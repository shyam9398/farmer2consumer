import axios from "axios";
import { supabase } from "@/lib/supabase";

// Normalize baseURL by stripping trailing slashes and redundant trailing /api/v1
export function sanitizeBaseURL(raw?: string): string {
  const url = (
    raw ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8001"
  ).trim();

  return url.replace(/\/+$/, "").replace(/\/api\/v1\/?$/, "");
}

const baseURL = sanitizeBaseURL();

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export function normalizeApiPath(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/([^:])\/{2,}/g, "$1/");
  }
  // Collapse any duplicate slashes first
  const clean = url.replace(/\/{2,}/g, "/");
  // Strip all leading slashes
  let path = clean.replace(/^\/+/, "");
  // Remove leading api/v1 or api/v1/ if already present
  if (path.startsWith("api/v1/")) {
    path = path.slice("api/v1/".length);
  } else if (path === "api/v1") {
    path = "";
  }
  return path ? `/api/v1/${path}` : "/api/v1";
}

// Request Interceptor: Attach Supabase JWT Bearer token or Demo token and normalize URL
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Sanitize baseURL on config if set
    if (config.baseURL) {
      config.baseURL = sanitizeBaseURL(config.baseURL);
    }

    // 2. Normalize config.url to prevent double slashes (e.g. //api/v1)
    if (config.url) {
      config.url = normalizeApiPath(config.url);
    }

    try {
      const { data } = await supabase.auth.getSession();
      let token = data?.session?.access_token;

      // If no live Supabase session, check for demo token
      if (!token) {
        token = localStorage.getItem("mandi_demo_token") || undefined;
      }

      // If demo profile is in localStorage but token hasn't been obtained yet, fetch it automatically
      if (!token && localStorage.getItem("mandi_demo_profile")) {
        try {
          const raw = localStorage.getItem("mandi_demo_profile");
          const savedProfile = raw ? JSON.parse(raw) : null;
          if (savedProfile?.role) {
            const cleanUrl = `${baseURL}/api/v1/auth/demo-login`;
            const res = await axios.post(cleanUrl, { role: savedProfile.role });
            if (res.data?.access_token) {
              const accessTok: string = res.data.access_token;
              token = accessTok;
              localStorage.setItem("mandi_demo_token", accessTok);
            }
          }
        } catch (e) {
          console.warn("Unable to fetch demo token in interceptor:", e);
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Unable to fetch session token for request:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Uniform error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || error.message;

    if (status === 401) {
      console.warn("Unauthorized API call (401):", detail);
    } else if (status === 403) {
      console.warn("Forbidden API call (403):", detail);
    }

    return Promise.reject(error);
  }
);
