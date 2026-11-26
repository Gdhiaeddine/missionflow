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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { SimpleSelect } from "@/components/shared/simple-select"
import { useSaveEmployee, useSettings } from "@/hooks/use-data"
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
  const { data: settings } = useSettings()
  const positionOptions = (settings?.preferences?.positionOptions ?? []).filter(Boolean)
  const defaultPosition = settings?.preferences?.defaultPosition || positionOptions[0] || ""

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? toFormValues(employee) : { ...EMPTY_VALUES, position: defaultPosition },
    mode: "onTouched",
  })
  const { errors } = form.formState

  useEffect(() => {
    if (open) {
      if (employee) {
        const fullName = [employee.lastName, employee.firstName].filter(Boolean).join(" ").trim()
        form.reset({ ...toFormValues(employee), lastName: fullName, firstName: "" })
      } else {
        form.reset({ ...EMPTY_VALUES, position: defaultPosition })
      }
    }
  }, [open, employee, defaultPosition, form])

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
            <Field data-invalid={!!errors.lastName || undefined} className="sm:col-span-2">
              <FieldLabel htmlFor="lastName">Nom complet *</FieldLabel>
              <Input id="lastName" placeholder="Ex. Benali Karim" aria-invalid={!!errors.lastName} {...form.register("lastName")} />
              <FieldError errors={[errors.lastName]} />
            </Field>
            <Controller
              control={form.control}
              name="position"
              render={({ field }) => (
                <Field data-invalid={!!errors.position || undefined}>
                  <FieldLabel htmlFor="position">Fonction *</FieldLabel>
                  <SimpleSelect
                    id="position"
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={!!errors.position}
                    placeholder="Sélectionner une fonction"
                    options={positionOptions.map((p) => ({ value: p, label: p }))}
                  />
                  <FieldError errors={[errors.position]} />
                </Field>
              )}
            />
            <Field data-invalid={!!errors.phone || undefined}>
              <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
              <Input id="phone" placeholder="0550 00 00 00" aria-invalid={!!errors.phone} {...form.register("phone")} />
              <FieldError errors={[errors.phone]} />
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
