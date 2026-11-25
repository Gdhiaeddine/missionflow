"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { SessionUser } from "@/types"
import * as authApi from "@/lib/api/auth"
import { can, type Permission } from "@/lib/permissions"

interface AuthContextValue {
  user: SessionUser | null
  status: "loading" | "authenticated" | "unauthenticated"
  login: (identifier: string, password: string, remember: boolean) => Promise<SessionUser>
  logout: () => void
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading")

  useEffect(() => {
    const session = authApi.getStoredSession()
    setUser(session)
    setStatus(session ? "authenticated" : "unauthenticated")
  }, [])

  const login = useCallback(async (identifier: string, password: string, remember: boolean) => {
    const response = await authApi.login({ identifier, password }, remember)
    setUser(response.user)
    setStatus("authenticated")
    return response.user
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    queryClient.clear()
    setUser(null)
    setStatus("unauthenticated")
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, can: (permission) => can(user?.role, permission) }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider")
  return context
}
