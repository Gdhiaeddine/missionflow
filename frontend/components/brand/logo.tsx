import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/logo.png"
      alt="Logo"
      className={cn("h-9 w-auto shrink-0 object-contain", className)}
    />
  )
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <div className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-xs font-medium text-muted-foreground">Gestion des Ordres de Mission</span>
        </div>
      )}
    </div>
  )
}
