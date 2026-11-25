"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { SimpleSelect } from "@/components/shared/simple-select"
import { useSaveUser } from "@/hooks/use-data"
import { ROLE_LABELS } from "@/lib/constants"
import { userSchema, type UserFormValues } from "@/lib/validations"
import type { Role, SessionUser } from "@/types"

const EMPTY_VALUES: UserFormValues = {
  fullName: "",
  username: "",
  email: "",
  role: "AGENT_EXPEDITION",
  password: "",
  status: "ACTIF",
}

function toFormValues(user: SessionUser): UserFormValues {
  return {
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    password: "",
    status: user.status,
  }
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: SessionUser
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const isEdit = !!user
  const saveUser = useSaveUser(user?.id)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? toFormValues(user) : EMPTY_VALUES,
    mode: "onTouched",
  })
  const { errors } = form.formState

  useEffect(() => {
    if (open) {
      form.reset(user ? toFormValues(user) : EMPTY_VALUES)
    }
  }, [open, user, form])

  async function onSubmit(data: UserFormValues) {
    try {
      const saved = await saveUser.mutateAsync(data)
      toast.success(isEdit ? "Utilisateur mis à jour" : "Utilisateur créé", {
        description: `${saved.fullName} (${ROLE_LABELS[saved.role]})`,
      })
      onOpenChange(false)
    } catch {
      // Handled by mutation's onError toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Modifier ${user.fullName}` : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour le profil et les droits d'accès de l'utilisateur."
              : "Créez un compte d'accès à l'application. Les champs marqués * sont obligatoires."}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.fullName || undefined} className="sm:col-span-2">
              <FieldLabel htmlFor="fullName">Nom complet *</FieldLabel>
              <Input id="fullName" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
              <FieldError errors={[errors.fullName]} />
            </Field>
            <Field data-invalid={!!errors.username || undefined}>
              <FieldLabel htmlFor="username">Nom d&apos;utilisateur *</FieldLabel>
              <Input id="username" placeholder="j.dupont" aria-invalid={!!errors.username} {...form.register("username")} />
              <FieldError errors={[errors.username]} />
            </Field>
            <Field data-invalid={!!errors.email || undefined}>
              <FieldLabel htmlFor="userEmail">E-mail *</FieldLabel>
              <Input
                id="userEmail"
                type="email"
                placeholder="nom@entreprise.dz"
                aria-invalid={!!errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="userRole">Rôle *</FieldLabel>
                  <SimpleSelect
                    id="userRole"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="userStatus">Statut *</FieldLabel>
                  <SimpleSelect
                    id="userStatus"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: "ACTIF", label: "Actif" },
                      { value: "INACTIF", label: "Inactif" },
                    ]}
                  />
                </Field>
              )}
            />
            <Field data-invalid={!!errors.password || undefined} className="sm:col-span-2">
              <FieldLabel htmlFor="userPassword">
                {isEdit ? "Nouveau mot de passe" : "Mot de passe *"}
              </FieldLabel>
              <Input
                id="userPassword"
                type="password"
                placeholder={isEdit ? "Laisser vide pour ne pas modifier" : "Minimum 8 caractères"}
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              {!isEdit && <FieldDescription>Au moins 8 caractères.</FieldDescription>}
              <FieldError errors={[errors.password]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={saveUser.isPending} onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveUser.isPending}>
              {saveUser.isPending && <Spinner data-icon="inline-start" />}
              {isEdit ? "Enregistrer" : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
