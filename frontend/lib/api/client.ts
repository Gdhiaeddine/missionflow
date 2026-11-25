export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

const TOKEN_KEY = "missionflow:token"

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message)
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query; signal?: AbortSignal } = {},
): Promise<T> {
  const base = API_URL.startsWith("http")
    ? API_URL
    : `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}${API_URL}`
  const url = new URL(`${base}${path}`)
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value))
    }
  }
  const token = getAccessToken()
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })
  if (!response.ok) {
    let payload: { message?: string } | undefined
    try {
      payload = await response.json()
    } catch {
      payload = undefined
    }
    throw new ApiError(payload?.message ?? `Erreur ${response.status}`, response.status, payload)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
