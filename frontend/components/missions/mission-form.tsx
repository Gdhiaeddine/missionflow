"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
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
import { useCreateMission, useEmployees, useMissionSuggestions, useNextReference, useUpdateMission, useUsers } from "@/hooks/use-data"
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
  const { data: suggestions } = useMissionSuggestions()
  const { data: employees = [] } = useEmployees()
  const { data: users = [] } = useUsers()
  const createMission = useCreateMission()
  const updateMission = useUpdateMission(mission?.id ?? "")
  const [pendingAction, setPendingAction] = useState<"draft" | "submit" | null>(null)

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

  async function save(data: MissionFormValues, submit: boolean) {
    setPendingAction(submit ? "submit" : "draft")
    try {
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
        const created = await createMission.mutateAsync({ input: data, submit })
        toast.success(submit ? "Ordre de mission soumis pour validation" : "Brouillon enregistré", {
          description: created.reference,
        })
        router.push(`/missions/${created.id}`)
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
                name="missionType"
                render={({ field }) => (
                  <Field data-invalid={!!errors.missionType || undefined}>
                    <FieldLabel htmlFor="missionType">Type de mission *</FieldLabel>
                    <SimpleSelect
                      id="missionType"
                      value={field.value}
                      onValueChange={field.onChange}
                      invalid={!!errors.missionType}
                      options={MISSION_TYPES.map((t) => ({ value: t, label: MISSION_TYPE_LABELS[t] }))}
                    />
                    <FieldError errors={[errors.missionType]} />
                  </Field>
                )}
              />
              <Field>
                <FieldLabel htmlFor="serviceAssignment">Résidence administrative</FieldLabel>
                <Input
                  id="serviceAssignment"
                  list="service-assignments"
                  placeholder="Ex. Sétif"
                  {...form.register("serviceAssignment")}
                />
                <datalist id="service-assignments">
                  {(suggestions?.serviceAssignments ?? []).map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </Field>
              <Field data-invalid={!!errors.subject || undefined} className="sm:col-span-2">
                <FieldLabel htmlFor="subject">Motif de déplacement *</FieldLabel>
                <Input
                  id="subject"
                  list="mission-subjects"
                  placeholder="Ex. Livraison de produits pharmaceutiques au client…"
                  aria-invalid={!!errors.subject}
                  {...form.register("subject")}
                />
                <datalist id="mission-subjects">
                  {(suggestions?.subjects ?? []).map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                <FieldError errors={[errors.subject]} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" rows={3} {...form.register("description")} />
              </Field>
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
                  list="departure-locations"
                  aria-invalid={!!errors.departureLocation}
                  {...form.register("departureLocation")}
                />
                <datalist id="departure-locations">
                  {(suggestions?.departureLocations ?? []).map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                <FieldError errors={[errors.departureLocation]} />
              </Field>
              <Field data-invalid={!!errors.destination || undefined}>
                <FieldLabel htmlFor="destination">Région (Se rendre à) *</FieldLabel>
                <Input
                  id="destination"
                  list="destinations"
                  placeholder="Ex. Alger, Oran, Sétif…"
                  aria-invalid={!!errors.destination}
                  {...form.register("destination")}
                />
                <datalist id="destinations">
                  {Array.from(new Set([...(suggestions?.destinations ?? []), ...DESTINATIONS])).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                <FieldError errors={[errors.destination]} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="destinationAddress">Adresse de destination</FieldLabel>
                <Input id="destinationAddress" {...form.register("destinationAddress")} />
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

          <FormSection legend="Transport et frais" description="Moyen de transport utilisé pour la mission">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
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
              {showVehicle && (
                <>
                  {values.transportation === "VEHICULE_SERVICE" && (
                    <Field>
                      <FieldLabel htmlFor="vehicleName">Type de véhicule</FieldLabel>
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
            </FieldGroup>
          </FormSection>

          <FormSection legend="Instructions et observations">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="instructions">Instructions</FieldLabel>
                <Textarea id="instructions" rows={3} {...form.register("instructions")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="observations">Observations</FieldLabel>
                <Textarea id="observations" rows={3} {...form.register("observations")} />
              </Field>
              <Controller
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="attachments">Pièces jointes</FieldLabel>
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={(e) => {
                        const names = Array.from(e.target.files ?? []).map((f) => f.name)
                        field.onChange(Array.from(new Set([...field.value, ...names])))
                        e.target.value = ""
                      }}
                    />
                    <FieldDescription>
                      Bons de livraison, convocations… Seuls les noms de fichiers sont conservés en mode démonstration.
                    </FieldDescription>
                    {field.value.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {field.value.map((name) => (
                          <li key={name}>
                            <Badge variant="secondary" className="gap-1.5 pr-1">
                              <Paperclip />
                              {name}
                              <button
                                type="button"
                                className="rounded-sm p-0.5 hover:bg-background"
                                aria-label={`Retirer ${name}`}
                                onClick={() => field.onChange(field.value.filter((n) => n !== name))}
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FormSection>

          {can("mission.editValidated") && (
            <FormSection legend="Administration" description="Visible uniquement par les administrateurs">
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="approverId"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="approverId">Validateur désigné</FieldLabel>
                      <SimpleSelect
                        id="approverId"
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Tout responsable"
                        options={[
                          { value: "", label: "Tout responsable" },
                          ...approvers.map((u) => ({ value: u.id, label: u.fullName })),
                        ]}
                      />
                    </Field>
                  )}
                />
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="adminComment">Commentaire administrateur</FieldLabel>
                  <Textarea id="adminComment" rows={2} {...form.register("adminComment")} />
                </Field>
              </FieldGroup>
            </FormSection>
          )}
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
