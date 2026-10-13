import Constants from "expo-constants";

// Base of the API, e.g. https://…/api/v1 (no trailing slash).
export function apiBase(): string {
  const direct = process.env.EXPO_PUBLIC_API_URL;
  if (direct) return direct.replace(/\/$/, "");
  const extra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (extra) return extra.replace(/\/$/, "");
  return "https://aido-intellisense.netlify.app/api/v1";
}

export function webBase(): string {
  return apiBase().replace(/\/api\/v1\/?$/, "");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
