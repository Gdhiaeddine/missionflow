"use client"

import { useEffect, useState } from "react"
import { Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeader, SectionCard } from "@/components/shared/page-header"
import { SimpleSelect } from "@/components/shared/simple-select"
import { useSettings, useUpdateSettings } from "@/hooks/use-data"
import type { AppSettings } from "@/types"

export function SettingsView() {
  const { data, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const [form, setForm] = useState<AppSettings | null>(null)
  const [newResidence, setNewResidence] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newPosition, setNewPosition] = useState("")

  useEffect(() => {
    if (data && !form) {
      setForm(structuredClone(data))
    }
  }, [data, form])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    await updateSettings.mutateAsync(form)
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <PageHeader
        title="Paramètres"
        description="Configuration de l'entreprise, du modèle d'ordre de mission et des préférences."
        actions={
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
            Enregistrer
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Entreprise" description="Informations affichées en en-tête du document officiel">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="companyName">Raison sociale</FieldLabel>
              <Input
                id="companyName"
                value={form.company.name}
                onChange={(e) => setForm({ ...form, company: { ...form.company, name: e.target.value } })}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="companyActivity">Activité / Fonction de l&apos;entreprise</FieldLabel>
              <Input
                id="companyActivity"
                placeholder="Ex. Transport et distribution de produits pharmaceutiques"
                value={form.company.activity ?? ""}
                onChange={(e) => setForm({ ...form, company: { ...form.company, activity: e.target.value } })}
              />
              <FieldDescription>Affichée juste en dessous de la raison sociale sur l&apos;ordre de mission.</FieldDescription>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="companyAddress">Adresse</FieldLabel>
              <Input
                id="companyAddress"
                value={form.company.address}
                onChange={(e) => setForm({ ...form, company: { ...form.company, address: e.target.value } })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="companyPhone">Téléphone</FieldLabel>
              <Input
                id="companyPhone"
                value={form.company.phone}
                onChange={(e) => setForm({ ...form, company: { ...form.company, phone: e.target.value } })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="companyEmail">E-mail</FieldLabel>
              <Input
                id="companyEmail"
                type="email"
                value={form.company.email}
                onChange={(e) => setForm({ ...form, company: { ...form.company, email: e.target.value } })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="companyWebsite">Site web</FieldLabel>
              <Input
                id="companyWebsite"
                value={form.company.website}
                onChange={(e) => setForm({ ...form, company: { ...form.company, website: e.target.value } })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="departmentContact">Responsable département</FieldLabel>
              <Input
                id="departmentContact"
                value={form.department.contactName ?? ""}
                onChange={(e) => setForm({ ...form, department: { ...form.department, contactName: e.target.value } })}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="newResidence">Résidences administratives</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="newResidence"
                  placeholder="Ex. Sétif"
                  value={newResidence}
                  onChange={(e) => setNewResidence(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = newResidence.trim()
                      if (!val) return
                      const current = form.preferences.residenceOptions ?? []
                      if (!current.includes(val)) {
                        const next = [...current, val]
                        setForm({
                          ...form,
                          preferences: {
                            ...form.preferences,
                            residenceOptions: next,
                            defaultResidence: form.preferences.defaultResidence || val,
                          },
                        })
                      }
                      setNewResidence("")
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const val = newResidence.trim()
                    if (!val) return
                    const current = form.preferences.residenceOptions ?? []
                    if (!current.includes(val)) {
                      const next = [...current, val]
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          residenceOptions: next,
                          defaultResidence: form.preferences.defaultResidence || val,
                        },
                      })
                    }
                    setNewResidence("")
                  }}
                >
                  <Plus className="size-4" />
                  Ajouter
                </Button>
              </div>
              <FieldDescription>
                Seules ces résidences apparaîtront dans le formulaire de création. Cochez celle par défaut.
              </FieldDescription>
              {(form.preferences.residenceOptions ?? []).length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {(form.preferences.residenceOptions ?? []).map((item) => {
                    const isDefault = (form.preferences.defaultResidence || form.preferences.residenceOptions?.[0]) === item
                    return (
                      <li
                        key={item}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                      >
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="defaultResidence"
                            checked={isDefault}
                            onChange={() =>
                              setForm({
                                ...form,
                                preferences: { ...form.preferences, defaultResidence: item },
                              })
                            }
                          />
                          <span>{item}</span>
                          {isDefault && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                              Par défaut
                            </span>
                          )}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Supprimer ${item}`}
                          onClick={() => {
                            const next = (form.preferences.residenceOptions ?? []).filter((r) => r !== item)
                            const nextDefault =
                              form.preferences.defaultResidence === item ? next[0] ?? "" : form.preferences.defaultResidence
                            setForm({
                              ...form,
                              preferences: {
                                ...form.preferences,
                                residenceOptions: next,
                                defaultResidence: nextDefault,
                              },
                            })
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="newSubject">Motifs de déplacement</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="newSubject"
                  placeholder="Ex. Livraison de produits pharmaceutiques"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = newSubject.trim()
                      if (!val) return
                      const current = form.preferences.subjectOptions ?? []
                      if (!current.includes(val)) {
                        const next = [...current, val]
                        setForm({
                          ...form,
                          preferences: {
                            ...form.preferences,
                            subjectOptions: next,
                            defaultSubject: form.preferences.defaultSubject || val,
                          },
                        })
                      }
                      setNewSubject("")
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const val = newSubject.trim()
                    if (!val) return
                    const current = form.preferences.subjectOptions ?? []
                    if (!current.includes(val)) {
                      const next = [...current, val]
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          subjectOptions: next,
                          defaultSubject: form.preferences.defaultSubject || val,
                        },
                      })
                    }
                    setNewSubject("")
                  }}
                >
                  <Plus className="size-4" />
                  Ajouter
                </Button>
              </div>
              <FieldDescription>
                Seuls ces motifs apparaîtront dans le formulaire de création. Cochez celui par défaut.
              </FieldDescription>
              {(form.preferences.subjectOptions ?? []).length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {(form.preferences.subjectOptions ?? []).map((item) => {
                    const isDefault = (form.preferences.defaultSubject || form.preferences.subjectOptions?.[0]) === item
                    return (
                      <li
                        key={item}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                      >
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="defaultSubject"
                            checked={isDefault}
                            onChange={() =>
                              setForm({
                                ...form,
                                preferences: { ...form.preferences, defaultSubject: item },
                              })
                            }
                          />
                          <span>{item}</span>
                          {isDefault && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                              Par défaut
                            </span>
                          )}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Supprimer ${item}`}
                          onClick={() => {
                            const next = (form.preferences.subjectOptions ?? []).filter((s) => s !== item)
                            const nextDefault =
                              form.preferences.defaultSubject === item ? next[0] ?? "" : form.preferences.defaultSubject
                            setForm({
                              ...form,
                              preferences: {
                                ...form.preferences,
                                subjectOptions: next,
                                defaultSubject: nextDefault,
                              },
                            })
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="newPosition">Fonctions (Employés)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="newPosition"
                  placeholder="Ex. Chauffeur, Agent d'expédition…"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = newPosition.trim()
                      if (!val) return
                      const current = form.preferences.positionOptions ?? []
                      if (!current.includes(val)) {
                        const next = [...current, val]
                        setForm({
                          ...form,
                          preferences: {
                            ...form.preferences,
                            positionOptions: next,
                            defaultPosition: form.preferences.defaultPosition || val,
                          },
                        })
                      }
                      setNewPosition("")
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const val = newPosition.trim()
                    if (!val) return
                    const current = form.preferences.positionOptions ?? []
                    if (!current.includes(val)) {
                      const next = [...current, val]
                      setForm({
                        ...form,
                        preferences: {
                          ...form.preferences,
                          positionOptions: next,
                          defaultPosition: form.preferences.defaultPosition || val,
                        },
                      })
                    }
                    setNewPosition("")
                  }}
                >
                  <Plus className="size-4" />
                  Ajouter
                </Button>
              </div>
              <FieldDescription>
                Seules ces fonctions apparaîtront lors de la création d&apos;un employé. Cochez celle par défaut.
              </FieldDescription>
              {(form.preferences.positionOptions ?? []).length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {(form.preferences.positionOptions ?? []).map((item) => {
                    const isDefault = (form.preferences.defaultPosition || form.preferences.positionOptions?.[0]) === item
                    return (
                      <li
                        key={item}
                        className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                      >
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="defaultPosition"
                            checked={isDefault}
                            onChange={() =>
                              setForm({
                                ...form,
                                preferences: { ...form.preferences, defaultPosition: item },
                              })
                            }
                          />
                          <span>{item}</span>
                          {isDefault && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                              Par défaut
                            </span>
                          )}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Supprimer ${item}`}
                          onClick={() => {
                            const next = (form.preferences.positionOptions ?? []).filter((p) => p !== item)
                            const nextDefault =
                              form.preferences.defaultPosition === item ? next[0] ?? "" : form.preferences.defaultPosition
                            setForm({
                              ...form,
                              preferences: {
                                ...form.preferences,
                                positionOptions: next,
                                defaultPosition: nextDefault,
                              },
                            })
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard title="Document officiel et impression" description="Mise en page et signatures du PDF">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="logoPosition">Position du logo</FieldLabel>
              <SimpleSelect
                id="logoPosition"
                value={form.document.logoPosition}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    document: { ...form.document, logoPosition: v as AppSettings["document"]["logoPosition"] },
                  })
                }
                options={[
                  { value: "GAUCHE", label: "Gauche" },
                  { value: "CENTRE", label: "Centre" },
                  { value: "DROITE", label: "Droite" },
                ]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="marginMm">Marges (mm)</FieldLabel>
              <Input
                id="marginMm"
                type="number"
                min={5}
                max={30}
                value={form.document.marginMm}
                onChange={(e) =>
                  setForm({ ...form, document: { ...form.document, marginMm: Number(e.target.value) || 14 } })
                }
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="headerText">Sous-titre du document</FieldLabel>
              <Input
                id="headerText"
                placeholder="Ex. Direction des Opérations — Département d'Expédition"
                value={form.document.headerText}
                onChange={(e) => setForm({ ...form, document: { ...form.document, headerText: e.target.value } })}
              />
              <FieldDescription>Affiché sous le nom de l&apos;entreprise sur l&apos;ordre de mission.</FieldDescription>
            </Field>
          </FieldGroup>
        </SectionCard>

        <SectionCard title="Signatures affichées" description="Blocs de signature sur l'ordre de mission imprimé">
          <div className="flex flex-col gap-4">
            <ToggleRow
              id="sigAgent"
              label="Signature de l'agent missionné"
              checked={form.document.signatures.agent}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  document: { ...form.document, signatures: { ...form.document.signatures, agent: checked } },
                })
              }
            />
            <ToggleRow
              id="sigResponsable"
              label="Signature du responsable du département"
              checked={form.document.signatures.responsable}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  document: { ...form.document, signatures: { ...form.document.signatures, responsable: checked } },
                })
              }
            />
            <ToggleRow
              id="sigDirection"
              label="Signature de la direction"
              checked={form.document.signatures.direction}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  document: { ...form.document, signatures: { ...form.document.signatures, direction: checked } },
                })
              }
            />
            <ToggleRow
              id="sigCachet"
              label="Emplacement du cachet officiel"
              checked={form.document.signatures.cachet}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  document: { ...form.document, signatures: { ...form.document.signatures, cachet: checked } },
                })
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Préférences et notifications" description="Affichage et alertes de workflow">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="dateFormat">Format de date</FieldLabel>
              <SimpleSelect
                id="dateFormat"
                value={form.preferences.dateFormat}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    preferences: { ...form.preferences, dateFormat: v as AppSettings["preferences"]["dateFormat"] },
                  })
                }
                options={[
                  { value: "dd/MM/yyyy", label: "JJ/MM/AAAA (25/11/2026)" },
                  { value: "dd MMM yyyy", label: "25 nov. 2026" },
                  { value: "yyyy-MM-dd", label: "AAAA-MM-JJ (2026-11-25)" },
                ]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="timeFormat">Format d&apos;heure</FieldLabel>
              <SimpleSelect
                id="timeFormat"
                value={form.preferences.timeFormat}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    preferences: { ...form.preferences, timeFormat: v as AppSettings["preferences"]["timeFormat"] },
                  })
                }
                options={[
                  { value: "24h", label: "24 heures" },
                  { value: "12h", label: "12 heures" },
                ]}
              />
            </Field>
          </FieldGroup>
          <div className="mt-5 flex flex-col gap-4 border-t pt-4">
            <ToggleRow
              id="notifySubmission"
              label="Notifier lors d'une soumission pour validation"
              checked={form.preferences.notifyOnSubmission}
              onCheckedChange={(checked) =>
                setForm({ ...form, preferences: { ...form.preferences, notifyOnSubmission: checked } })
              }
            />
            <ToggleRow
              id="notifyDecision"
              label="Notifier lors d'une validation ou d'un refus"
              checked={form.preferences.notifyOnDecision}
              onCheckedChange={(checked) =>
                setForm({ ...form, preferences: { ...form.preferences, notifyOnDecision: checked } })
              }
            />
            <ToggleRow
              id="notifyPrint"
              label="Journaliser les lancements d'impression"
              description="Enregistre chaque ouverture de la boîte de dialogue d'impression."
              checked={form.preferences.notifyOnPrint}
              onCheckedChange={(checked) =>
                setForm({ ...form, preferences: { ...form.preferences, notifyOnPrint: checked } })
              }
            />
          </div>
        </SectionCard>
      </div>
    </form>
  )
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
