import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/brand/logo"
import { DEPARTMENT_NAME } from "@/lib/constants"

export const metadata: Metadata = { title: "Connexion" }

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1fr_minmax(0,680px)] xl:grid-cols-[1fr_minmax(0,740px)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex items-center gap-2 text-sm font-medium text-blue-100">
          <span className="size-1.5 rounded-full bg-blue-300" />
          {DEPARTMENT_NAME}
        </div>
        <div className="relative flex max-w-lg flex-col gap-6">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
            Ordres de mission préparés, validés et imprimés en toute traçabilité.
          </h1>
          <p className="text-base leading-relaxed text-blue-100/80 text-pretty">
            Création, circuit de validation, génération du document officiel et historique complet des
            impressions — au sein d&apos;un seul outil interne.
          </p>
          <ul className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm">
            <li className="flex flex-col gap-1">
              <span className="text-2xl font-semibold">A4</span>
              <span className="text-blue-100/70">Document officiel</span>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-2xl font-semibold">4</span>
              <span className="text-blue-100/70">Rôles définis</span>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-2xl font-semibold">100%</span>
              <span className="text-blue-100/70">Actions tracées</span>
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-blue-100/60">Usage interne réservé au personnel autorisé.</p>
      </section>

      <section className="flex flex-col justify-center bg-background px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-6">
            <Logo className="flex-col justify-center gap-3 text-center [&_img]:h-20 [&_span]:text-sm" />
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Connexion
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Accédez à votre espace de gestion des ordres de mission.
              </p>
            </div>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="text-center text-xs text-muted-foreground lg:hidden">
            {DEPARTMENT_NAME} — Usage interne réservé au personnel autorisé.
          </p>
        </div>
      </section>
    </main>
  )
}
