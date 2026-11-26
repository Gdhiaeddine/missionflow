"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { AlertTriangle, Paperclip, Save, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { PageHeader } from "@/components/shared/page-header"
import { SimpleSelect } from "@/components/shared/simple-select"
import { EmployeeCombobox } from "@/components/missions/employee-combobox"
import { VehicleCombobox } from "@/components/missions/vehicle-combobox"
import { useCreateMission, useCreateVehicle, useEmployees, useMissionSuggestions, useNextReference, useSettings, useUpdateMission, useUsers, useVehicles } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { missionSchema, type MissionFormValues } from "@/lib/validations"
import {
  DESTINATIONS,
  MISSION_TYPE_LABELS,
  MISSION_TYPES,
  TRANSPORTATION_LABELS,
  TRANSPORTATIONS,
} from "@/lib/constants"
import { computeDuration, pluralDays } from "@/lib/utils/format"
import type { Mission } from "@/types"

const getEmptyValues = (): MissionFormValues => {
  const now = new Date()
  return {
    orderNumber: "",
    orderYear: String(now.getFullYear()),
    creationDate: now.toISOString().slice(0, 10),
    missionType: "LIVRAISON",
    subject: "",
    description: "",
    employeeId: "",
    employeePosition: "",
    serviceAssignment: "",
    departureLocation: "Sétif",
    destination: "",
    destinationAddress: "",
    departureDate: "",
    departureTime: "",
    returnDate: "",
    returnTime: "",
    transportation: "VEHICULE_SERVICE",
    vehicleName: "",
    vehicleRegistration: "",
    observations: "",
    instructions: "",
    estimatedExpenses: "",
    attachments: [],
    approverId: "",
    adminComment: "",
  }
}

function toFormValues(mission: Mission): MissionFormValues {
  const createdYear = mission.createdAt ? String(new Date(mission.createdAt).getFullYear()) : String(new Date().getFullYear())
  return {
    orderNumber: mission.orderNumber ?? "",
    orderYear: mission.orderYear ?? createdYear,
    creationDate: mission.createdAt ? mission.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    missionType: mission.missionType,
    subject: mission.subject,
    description: mission.description ?? "",
    employeeId: mission.employeeId,
    employeePosition: mission.employeePosition ?? "",
    serviceAssignment: mission.serviceAssignment ?? "",
    departureLocation: mission.departureLocation,
    destination: mission.destination,
    destinationAddress: mission.destinationAddress ?? "",
    departureDate: mission.departureDate ?? "",
    departureTime: mission.departureTime ?? "",
    returnDate: mission.returnDate ?? "",
    returnTime: mission.returnTime ?? "",
    transportation: mission.transportation,
    vehicleName: mission.vehicleName ?? "",
    vehicleRegistration: mission.vehicleRegistration ?? "",
    observations: mission.observations ?? "",
    instructions: mission.instructions ?? "",
    estimatedExpenses: mission.estimatedExpenses !== undefined ? String(mission.estimatedExpenses) : "",
    attachments: mission.attachments ?? [],
    approverId: mission.approverId ?? "",
    adminComment: mission.adminComment ?? "",
  }
}

export function MissionForm({ mission }: { mission?: Mission }) {
  const router = useRouter()
  const { user, can } = useAuth()
  const isEdit = !!mission
  const { data: nextReference } = useNextReference()
  const { data: settings } = useSettings()
  const { data: suggestions } = useMissionSuggestions()
  const { data: employees = [] } = useEmployees()
  const { data: vehicles = [] } = useVehicles()
  const { data: users = [] } = useUsers()
  const createMission = useCreateMission()
  const createVehicle = useCreateVehicle()
  const updateMission = useUpdateMission(mission?.id ?? "")
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null)
  const [vehicleMode, setVehicleMode] = useState<"existing" | "new">("existing")

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission ? toFormValues(mission) : getEmptyValues(),
    mode: "onTouched",
  })
  const { errors, isDirty } = form.formState
  const values = useWatch({ control: form.control })

  const duration = computeDuration(values.departureDate, values.departureTime, values.returnDate, values.returnTime)
  const approvers = useMemo(
    () => users.filter((u) => (u.role === "RESPONSABLE" || u.role === "ADMIN") && u.status === "ACTIF"),
    [users],
  )
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "ACTIF" || e.id === mission?.employeeId),
    [employees, mission?.employeeId],
  )
  const selectedEmployee = employees.find((e) => e.id === values.employeeId)
  const wasApproved = mission?.status === "VALIDE" || mission?.status === "EN_ATTENTE"
  const showVehicle = values.transportation === "VEHICULE_SERVICE" || values.transportation === "VEHICULE_PERSONNEL"

  const residenceOptions = useMemo(() => {
    const list = (settings?.preferences?.residenceOptions ?? []).filter(Boolean)
    return list.map((item) => ({ value: item, label: item }))
  }, [settings?.preferences?.residenceOptions])

  const subjectOptions = useMemo(() => {
    const list = (settings?.preferences?.subjectOptions ?? []).filter(Boolean)
    return list.map((item) => ({ value: item, label: item }))
  }, [settings?.preferences?.subjectOptions])

  useEffect(() => {
    const defaultRes = settings?.preferences?.defaultResidence || settings?.preferences?.residenceOptions?.[0]
    if (!isEdit && defaultRes && !form.getValues("serviceAssignment")) {
      form.setValue("serviceAssignment", defaultRes)
    }
    const defaultSubj = settings?.preferences?.defaultSubject || settings?.preferences?.subjectOptions?.[0]
    if (!isEdit && defaultSubj && !form.getValues("subject")) {
      form.setValue("subject", defaultSubj)
    }
  }, [
    isEdit,
    settings?.preferences?.defaultResidence,
    settings?.preferences?.residenceOptions,
    settings?.preferences?.defaultSubject,
    settings?.preferences?.subjectOptions,
    form,
  ])

  async function save(data: MissionFormValues, submit: boolean) {
    setPendingAction(submit ? "submit" : "draft")
    try {
      if (
        (data.transportation === "VEHICULE_SERVICE" || data.transportation === "VEHICULE_PERSONNEL") &&
        data.vehicleRegistration?.trim() &&
        data.vehicleName?.trim() &&
        !vehicles.some((v) => v.registration === data.vehicleRegistration?.trim())
      ) {
        await createVehicle
          .mutateAsync({
            name: data.vehicleName.trim(),
            type: data.vehicleName.trim(),
            registration: data.vehicleRegistration.trim(),
            transportation: data.transportation as "VEHICULE_SERVICE" | "VEHICULE_PERSONNEL",
          })
          .catch(() => {})
      }
      if (isEdit && mission) {
        const result = await updateMission.mutateAsync(data)
        if (result.requiresReapproval) {
          toast.warning("Modification enregistrée", {
            description: "Le document a changé : une nouvelle validation est requise avant impression.",
          })
        } else {
          toast.success("Ordre de mission mis à jour")
        }
        router.push(`/missions/${mission.id}`)
      } else {
        const created = await createMission.mutateAsync({ input: data, submit: false })
        toast.success("Ordre de mission créé", {
          description: created.reference,
        })
        router.push(`/missions/${created.id}/document`)
      }
    } catch {
      // Errors are surfaced by the mutation's toast handler.
    } finally {
      setPendingAction(null)
    }
  }

  const busy = pendingAction !== null

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => save(data, false))}
      className="flex flex-col gap-6"
    >
      <PageHeader
        title={isEdit ? `Modifier ${mission.reference}` : "Nouvel ordre de mission"}
        description={
          isEdit
            ? `Version ${mission.version} — les modifications des champs officiels créent une nouvelle version.`
            : "Renseignez les informations de la mission. Les champs marqués * sont obligatoires."
        }
        actions={
          <Badge variant="outline" className="font-mono">
            N° {values.orderNumber?.trim() || "........"} / {values.orderYear?.trim() || new Date().getFullYear()}
          </Badge>
        }
      />

      {isEdit && wasApproved && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Ordre déjà soumis ou validé</AlertTitle>
          <AlertDescription>
            Toute modification de l&apos;employé, des dates, de la destination, de l&apos;objet ou du transport
            renverra l&apos;ordre en validation. Le document actuel ne pourra plus être imprimé.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <FormSection legend="Informations générales" description="Référence, date de création et motif de déplacement">
            <FieldGroup className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="orderNumber">N° d&apos;ordre</FieldLabel>
                <Input
                  id="orderNumber"
                  placeholder="........ (optionnel)"
                  {...form.register("orderNumber")}
                />
                <FieldDescription>Laissez vide pour conserver des pointillés.</FieldDescription>
              </Field>
              <Field data-invalid={!!errors.orderYear || undefined}>
                <FieldLabel htmlFor="orderYear">Année</FieldLabel>
                <Input
                  id="orderYear"
                  placeholder={String(new Date().getFullYear())}
                  maxLength={4}
                  aria-invalid={!!errors.orderYear}
                  {...form.register("orderYear")}
                />
                <FieldError errors={[errors.orderYear]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="creationDate">Date de création</FieldLabel>
                <Input id="creationDate" type="date" {...form.register("creationDate")} />
              </Field>
            </FieldGroup>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="serviceAssignment"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="serviceAssignment">Résidence administrative</FieldLabel>
                    <SimpleSelect
                      id="serviceAssignment"
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Sélectionner une résidence"
                      options={residenceOptions}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <Field data-invalid={!!errors.subject || undefined} className="sm:col-span-2">
                    <FieldLabel htmlFor="subject">Motif de déplacement *</FieldLabel>
                    <SimpleSelect
                      id="subject"
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      invalid={!!errors.subject}
                      placeholder="Sélectionner un motif"
                      options={subjectOptions}
                    />
                    <FieldError errors={[errors.subject]} />
                  </Field>
                )}
              />
            </FieldGroup>
          </FormSection>

          <FormSection legend="Employé missionné" description="Nom de l'employé et fonction">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <Field data-invalid={!!errors.employeeId || undefined}>
                    <FieldLabel htmlFor="employeeId">Nom de l&apos;employé *</FieldLabel>
                    <EmployeeCombobox
                      id="employeeId"
                      employees={activeEmployees}
                      value={field.value}
                      onChange={(id) => {
                        field.onChange(id)
                        field.onBlur()
                        const emp = employees.find((e) => e.id === id)
                        if (emp) {
                          form.setValue("employeePosition", emp.position, { shouldDirty: true })
                        }
                      }}
                      invalid={!!errors.employeeId}
                    />
                    <FieldError errors={[errors.employeeId]} />
                  </Field>
                )}
              />
              <Field>
                <FieldLabel htmlFor="employeePosition">Fonction</FieldLabel>
                <Input
                  id="employeePosition"
                  placeholder="Ex. Chauffeur, Agent d'expédition…"
                  {...form.register("employeePosition")}
                />
              </Field>
              {selectedEmployee && (
                <dl className="grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-3 text-sm sm:col-span-2 sm:grid-cols-4">
                  <MiniInfo label="Matricule" value={selectedEmployee.employeeNumber} />
                  <MiniInfo label="Fonction" value={values.employeePosition || selectedEmployee.position} />
                  <MiniInfo label="Téléphone" value={selectedEmployee.phone} />
                  <MiniInfo label="E-mail" value={selectedEmployee.email} />
                </dl>
              )}
            </FieldGroup>
          </FormSection>

          <FormSection legend="Itinéraire et dates" description="Région (se rendre à) et horaires optionnels">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.departureLocation || undefined}>
                <FieldLabel htmlFor="departureLocation">Lieu de départ *</FieldLabel>
                <Input
                  id="departureLocation"
                  aria-invalid={!!errors.departureLocation}
                  {...form.register("departureLocation")}
                />
                <FieldError errors={[errors.departureLocation]} />
              </Field>
              <Field data-invalid={!!errors.destination || undefined}>
                <FieldLabel htmlFor="destination">Région (Se rendre à) *</FieldLabel>
                <Input
                  id="destination"
                  placeholder="Ex. Alger, Oran, Sétif…"
                  aria-invalid={!!errors.destination}
                  {...form.register("destination")}
                />
                <FieldError errors={[errors.destination]} />
              </Field>
              <Field data-invalid={!!errors.departureDate || undefined}>
                <FieldLabel htmlFor="departureDate">Date de départ</FieldLabel>
                <Input id="departureDate" type="date" aria-invalid={!!errors.departureDate} {...form.register("departureDate")} />
                <FieldError errors={[errors.departureDate]} />
              </Field>
              <Field data-invalid={!!errors.departureTime || undefined}>
                <FieldLabel htmlFor="departureTime">Heure de départ</FieldLabel>
                <Input id="departureTime" type="time" aria-invalid={!!errors.departureTime} {...form.register("departureTime")} />
                <FieldError errors={[errors.departureTime]} />
              </Field>
              <Field data-invalid={!!errors.returnDate || undefined}>
                <FieldLabel htmlFor="returnDate">Date d&apos;arrivée</FieldLabel>
                <Input
                  id="returnDate"
                  type="date"
                  min={values.departureDate || undefined}
                  aria-invalid={!!errors.returnDate}
                  {...form.register("returnDate", { deps: ["departureDate", "departureTime", "returnTime"] })}
                />
                <FieldError errors={[errors.returnDate]} />
              </Field>
              <Field data-invalid={!!errors.returnTime || undefined}>
                <FieldLabel htmlFor="returnTime">Heure d&apos;arrivée</FieldLabel>
                <Input
                  id="returnTime"
                  type="time"
                  aria-invalid={!!errors.returnTime}
                  {...form.register("returnTime", { deps: ["returnDate"] })}
                />
                <FieldError errors={[errors.returnTime]} />
              </Field>
            </FieldGroup>
          </FormSection>

          <FormSection legend="Transport" description="Moyen de transport utilisé pour la mission">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel>Mode de sélection du véhicule</FieldLabel>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="vehicleMode"
                      checked={vehicleMode === "existing"}
                      onChange={() => setVehicleMode("existing")}
                    />
                    <span>Véhicule existant</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="vehicleMode"
                      checked={vehicleMode === "new"}
                      onChange={() => {
                        setVehicleMode("new")
                        form.setValue("vehicleName", "")
                        form.setValue("vehicleRegistration", "")
                      }}
                    />
                    <span>Nouveau véhicule</span>
                  </label>
                </div>
              </Field>

              {vehicleMode === "new" && (
                <Controller
                  control={form.control}
                  name="transportation"
                  render={({ field }) => (
                    <Field data-invalid={!!errors.transportation || undefined}>
                      <FieldLabel htmlFor="transportation">Moyen de transport *</FieldLabel>
                      <SimpleSelect
                        id="transportation"
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v)
                          form.trigger("vehicleRegistration")
                        }}
                        options={TRANSPORTATIONS.map((t) => ({ value: t, label: TRANSPORTATION_LABELS[t] }))}
                      />
                      <FieldError errors={[errors.transportation]} />
                    </Field>
                  )}
                />
              )}
              {showVehicle && (
                <>

                  {vehicleMode === "existing" ? (
                    <Field className="sm:col-span-2">
                      <FieldLabel htmlFor="vehicleSelect">Véhicule enregistré</FieldLabel>
                      <VehicleCombobox
                        id="vehicleSelect"
                        vehicles={vehicles}
                        value={vehicles.find((v) => v.registration === values.vehicleRegistration)?.id ?? ""}
                        onChange={(id) => {
                          const found = vehicles.find((v) => v.id === id)
                          if (found) {
                            form.setValue("transportation", found.transportation ?? "VEHICULE_SERVICE")
                            form.setValue("vehicleName", found.name)
                            form.setValue("vehicleRegistration", found.registration)
                            form.trigger("vehicleRegistration")
                          }
                        }}
                      />
                    </Field>
                  ) : (
                    <>
                      {values.transportation === "VEHICULE_SERVICE" && (
                        <Field>
                          <FieldLabel htmlFor="vehicleName">Nom / Modèle du véhicule</FieldLabel>
                          <Input
                            id="vehicleName"
                            list="vehicle-names"
                            placeholder="Ex. Sprinter"
                            {...form.register("vehicleName")}
                          />
                          <datalist id="vehicle-names">
                            {(suggestions?.vehicleNames ?? []).map((item) => (
                              <option key={item} value={item} />
                            ))}
                          </datalist>
                        </Field>
                      )}
                      <Field data-invalid={!!errors.vehicleRegistration || undefined}>
                        <FieldLabel htmlFor="vehicleRegistration">
                          Immatriculation{values.transportation === "VEHICULE_SERVICE" ? " *" : ""}
                        </FieldLabel>
                        <Input
                          id="vehicleRegistration"
                          list="vehicle-registrations"
                          placeholder="Ex. 111111.121.19"
                          aria-invalid={!!errors.vehicleRegistration}
                          {...form.register("vehicleRegistration")}
                        />
                        <datalist id="vehicle-registrations">
                          {(suggestions?.vehicleRegistrations ?? []).map((item) => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                        <FieldError errors={[errors.vehicleRegistration]} />
                      </Field>
                    </>
                  )}
                </>
              )}
            </FieldGroup>
          </FormSection>

        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Récapitulatif</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <MiniInfo
                label="N° d'ordre"
                value={`${values.orderNumber?.trim() || "........"} / ${values.orderYear?.trim() || new Date().getFullYear()}`}
              />
              <MiniInfo
                label="Employé"
                value={selectedEmployee ? `${selectedEmployee.lastName} ${selectedEmployee.firstName}` : "—"}
              />
              <MiniInfo
                label="Fonction"
                value={values.employeePosition || selectedEmployee?.position || "—"}
              />
              <MiniInfo label="Se rendre à" value={values.destination || "—"} />
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Durée calculée</dt>
                <dd
                  className={
                    duration.label === "Dates incohérentes" ? "font-medium text-destructive" : "font-medium"
                  }
                >
                  {duration.valid ? `${pluralDays(duration.days)} · ${duration.label}` : duration.label}
                </dd>
              </div>
              <MiniInfo label="Transport" value={values.transportation ? TRANSPORTATION_LABELS[values.transportation] : "—"} />
              <MiniInfo label="Date de création" value={values.creationDate || "—"} />
              <MiniInfo label="Créé par" value={isEdit ? undefined : user?.fullName} />
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            {!isEdit && can("mission.submit") && (
              <Button
                type="button"
                disabled={busy}
                onClick={form.handleSubmit((data) => save(data, true))}
              >
                {pendingAction === "submit" ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}
                Soumettre pour validation
              </Button>
            )}
            <Button type="submit" variant={isEdit ? "default" : "outline"} disabled={busy || (isEdit && !isDirty)}>
              {pendingAction === "draft" ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
              {isEdit ? "Enregistrer les modifications" : "Enregistrer le brouillon"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              render={<Link href={isEdit ? `/missions/${mission.id}` : "/missions"} />}
            >
              Annuler
            </Button>
          </div>
        </aside>
      </div>
    </form>
  )
}

function FormSection({
  legend,
  description,
  children,
}: {
  legend: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <FieldSet className="rounded-lg border bg-card p-5">
      <FieldLegend>{legend}</FieldLegend>
      {description && <FieldDescription className="-mt-2">{description}</FieldDescription>}
      {children}
    </FieldSet>
  )
}

function MiniInfo({ label, value }: { label: string; value?: string }) {
  if (value === undefined) return null
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
