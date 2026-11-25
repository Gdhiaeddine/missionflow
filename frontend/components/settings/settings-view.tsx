"use client"

import { useEffect, useState } from "react"
import { Save } from "lucide-react"
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
