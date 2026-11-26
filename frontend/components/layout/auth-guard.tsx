"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useAuth } from "@/providers/auth-provider"
import type { Permission } from "@/lib/permissions"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [status, router, pathname])

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Chargement de la session…
      </div>
    )
  }

  return <>{children}</>
}

export function AccessDenied() {
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert />
        </EmptyMedia>
        <EmptyTitle>Accès non autorisé</EmptyTitle>
        <EmptyDescription>
          Votre rôle ne permet pas d&apos;accéder à cette page. Contactez un administrateur si nécessaire.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" render={<Link href="/missions/new" />}>
          Retour au tableau de bord
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/** UI-only gate. The backend must enforce the same permission. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children: React.ReactNode
}) {
  const { can } = useAuth()
  if (!can(permission)) {
    return <AccessDenied />
  }
  return <>{children}</>
}
