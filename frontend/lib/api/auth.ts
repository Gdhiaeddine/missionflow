import type { SessionUser } from "@/types"
import { apiRequest, setAccessToken } from "./client"

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: SessionUser
}

const SESSION_KEY = "missionflow:session"

export function getStoredSession(): SessionUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

function storeSession(user: SessionUser, remember: boolean) {
  const target = remember ? window.localStorage : window.sessionStorage
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
  target.setItem(SESSION_KEY, JSON.stringify(user))
}

export async function login(request: LoginRequest, remember: boolean): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/login", { method: "POST", body: request })
  setAccessToken(response.accessToken)
  storeSession(response.user, remember)
  return response
}

export function logout() {
  setAccessToken(null)
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
}
