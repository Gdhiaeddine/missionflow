"use client"

import { useState } from "react"
import { Car, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/shared/page-header"
import { SimpleSelect } from "@/components/shared/simple-select"
import { Spinner } from "@/components/ui/spinner"
import { TRANSPORTATION_LABELS } from "@/lib/constants"
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicles } from "@/hooks/use-data"
import type { Vehicle } from "@/types"

export function VehiclesList() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [name, setName] = useState("")
  const [registration, setRegistration] = useState("")
  const [type, setType] = useState("")
  const [transportation, setTransportation] = useState<"VEHICULE_SERVICE" | "VEHICULE_PERSONNEL">("VEHICULE_SERVICE")

  function openCreate() {
    setEditing(null)
    setName("")
    setRegistration("")
    setType("")
    setTransportation("VEHICULE_SERVICE")
    setOpen(true)
  }

  function openEdit(v: Vehicle) {
    setEditing(v)
    setName(v.name)
    setRegistration(v.registration)
    setType(v.type)
    setTransportation(v.transportation ?? "VEHICULE_SERVICE")
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !registration.trim()) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }
    if (editing) {
      await updateVehicle.mutateAsync({
        id: editing.id,
        input: { name: name.trim(), registration: registration.trim(), transportation },
      })
    } else {
      await createVehicle.mutateAsync({
        name: name.trim(),
        registration: registration.trim(),
        transportation,
      })
      toast.success("Véhicule ajouté")
    }
    setOpen(false)
  }

  const saving = createVehicle.isPending || updateVehicle.isPending

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Véhicules"
        description="Gérez le parc de véhicules disponibles pour les ordres de mission."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Ajouter un véhicule
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom / Modèle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Moyen de transport</TableHead>
              <TableHead>Immatriculation</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Car className="size-8 opacity-40" />
                    <span>Aucun véhicule enregistré.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.type}</TableCell>
                  <TableCell>{TRANSPORTATION_LABELS[v.transportation] ?? v.transportation}</TableCell>
                  <TableCell className="font-mono text-xs">{v.registration}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(v)} aria-label="Modifier">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteVehicle.mutate(v.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le véhicule" : "Ajouter un véhicule"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="vehName">Nom / Modèle *</FieldLabel>
                <Input
                  id="vehName"
                  placeholder="Ex. Sprinter, Kangoo…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vehTransportation">Moyen de transport *</FieldLabel>
                <SimpleSelect
                  id="vehTransportation"
                  value={transportation}
                  onValueChange={(v) => setTransportation(v as "VEHICULE_SERVICE" | "VEHICULE_PERSONNEL")}
                  options={[
                    { value: "VEHICULE_SERVICE", label: TRANSPORTATION_LABELS.VEHICULE_SERVICE },
                    { value: "VEHICULE_PERSONNEL", label: TRANSPORTATION_LABELS.VEHICULE_PERSONNEL },
                  ]}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vehReg">Immatriculation *</FieldLabel>
                <Input
                  id="vehReg"
                  placeholder="Ex. 111111.121.19"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Spinner data-icon="inline-start" />}
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
