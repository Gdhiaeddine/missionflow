"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { loginSchema, type LoginFormValues } from "@/lib/validations"
import { useAuth } from "@/providers/auth-provider"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, status } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: true },
  })

  const next = searchParams.get("next")
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"

  useEffect(() => {
    if (status === "authenticated") router.replace(redirectTo)
  }, [status, router, redirectTo])

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      await login(values.identifier, values.password, values.remember)
      router.replace(redirectTo)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Connexion impossible.")
    }
  }

  const { errors, isSubmitting } = form.formState

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={!!errors.identifier || undefined}>
            <FieldLabel htmlFor="identifier">E-mail ou nom d&apos;utilisateur</FieldLabel>
            <Input
              id="identifier"
              autoComplete="username"
              placeholder="nom@entreprise.dz"
              aria-invalid={!!errors.identifier}
              {...form.register("identifier")}
            />
            <FieldError errors={[errors.identifier]} />
          </Field>
          <Field data-invalid={!!errors.password || undefined}>
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError errors={[errors.password]} />
          </Field>
          <Controller
            control={form.control}
            name="remember"
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id="remember"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <FieldLabel htmlFor="remember" className="cursor-pointer font-normal">
                  Se souvenir de moi
                </FieldLabel>
              </Field>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Se connecter
          </Button>
        </FieldGroup>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Mot de passe oublié ? Contactez l&apos;administrateur.
      </p>
    </div>
  )
}
