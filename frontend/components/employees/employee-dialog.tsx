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
import { useSaveEmployee } from "@/hooks/use-data"
import { employeeSchema, type EmployeeFormValues } from "@/lib/validations"
import type { Employee } from "@/types"

const EMPTY_VALUES: EmployeeFormValues = {
  employeeNumber: "",
  lastName: "",
  firstName: "",
  birthDate: "",
  position: "",
  phone: "",
  address: "",
  hireDate: "",
  status: "ACTIF",
}

function toFormValues(employee: Employee): EmployeeFormValues {
  return {
    employeeNumber: employee.employeeNumber,
    lastName: employee.lastName,
    firstName: employee.firstName,
    birthDate: employee.birthDate ?? "",
    position: employee.position,
    phone: employee.phone,
    address: employee.address ?? "",
    hireDate: employee.hireDate ?? "",
    status: employee.status,
  }
}

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee
}

export function EmployeeDialog({ open, onOpenChange, employee }: EmployeeDialogProps) {
  const isEdit = !!employee
  const saveEmployee = useSaveEmployee(employee?.id)

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? toFormValues(employee) : EMPTY_VALUES,
    mode: "onTouched",
  })
  const { errors } = form.formState

  useEffect(() => {
    if (open) {
      form.reset(employee ? toFormValues(employee) : EMPTY_VALUES)
    }
  }, [open, employee, form])

  async function onSubmit(data: EmployeeFormValues) {
    try {
      const saved = await saveEmployee.mutateAsync(data)
      toast.success(isEdit ? "Employé mis à jour" : "Employé ajouté", {
        description: `${saved.lastName.toUpperCase()} ${saved.firstName} (${saved.employeeNumber})`,
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
          <DialogTitle>{isEdit ? `Modifier ${employee.lastName} ${employee.firstName}` : "Nouvel employé"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations de l'agent. Les champs marqués * sont obligatoires."
              : "Renseignez les informations du nouvel agent. Les champs marqués * sont obligatoires."}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.employeeNumber || undefined}>
              <FieldLabel htmlFor="employeeNumber">Matricule</FieldLabel>
              <Input
                id="employeeNumber"
                placeholder="Automatique si vide (ex. EMP-001)"
                aria-invalid={!!errors.employeeNumber}
                {...form.register("employeeNumber")}
              />
              {!isEdit && <FieldDescription>Laissez vide pour générer automatiquement.</FieldDescription>}
              <FieldError errors={[errors.employeeNumber]} />
            </Field>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="employeeStatus">Statut *</FieldLabel>
                  <SimpleSelect
                    id="employeeStatus"
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
            <Field data-invalid={!!errors.lastName || undefined}>
              <FieldLabel htmlFor="lastName">Nom *</FieldLabel>
              <Input id="lastName" aria-invalid={!!errors.lastName} {...form.register("lastName")} />
              <FieldError errors={[errors.lastName]} />
            </Field>
            <Field data-invalid={!!errors.firstName || undefined}>
              <FieldLabel htmlFor="firstName">Prénom *</FieldLabel>
              <Input id="firstName" aria-invalid={!!errors.firstName} {...form.register("firstName")} />
              <FieldError errors={[errors.firstName]} />
            </Field>
            <Field data-invalid={!!errors.position || undefined} className="sm:col-span-2">
              <FieldLabel htmlFor="position">Fonction *</FieldLabel>
              <Input
                id="position"
                placeholder="Ex. Chauffeur poids lourd, Agent d'expédition…"
                aria-invalid={!!errors.position}
                {...form.register("position")}
              />
              <FieldError errors={[errors.position]} />
            </Field>
            <Field data-invalid={!!errors.phone || undefined} className="sm:col-span-2">
              <FieldLabel htmlFor="phone">Téléphone *</FieldLabel>
              <Input id="phone" placeholder="0550 00 00 00" aria-invalid={!!errors.phone} {...form.register("phone")} />
              <FieldError errors={[errors.phone]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="hireDate">Date d&apos;embauche</FieldLabel>
              <Input id="hireDate" type="date" {...form.register("hireDate")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="birthDate">Date de naissance</FieldLabel>
              <Input id="birthDate" type="date" {...form.register("birthDate")} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="address">Adresse</FieldLabel>
              <Input id="address" {...form.register("address")} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={saveEmployee.isPending} onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveEmployee.isPending}>
              {saveEmployee.isPending && <Spinner data-icon="inline-start" />}
              {isEdit ? "Enregistrer" : "Ajouter l'employé"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
