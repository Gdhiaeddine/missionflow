"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/types"

interface VehicleComboboxProps {
  id?: string
  vehicles: Vehicle[]
  value: string
  onChange: (vehicleId: string) => void
  invalid?: boolean
}

export function VehicleCombobox({ id, vehicles, value, onChange, invalid }: VehicleComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = vehicles.find((v) => v.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            className={cn(
              "h-9 w-full justify-between px-3 font-normal",
              !selected && "text-muted-foreground",
              invalid && "border-destructive",
            )}
          />
        }
      >
        <span className="truncate">
          {selected ? `${selected.name} — ${selected.registration}` : "Sélectionner un véhicule…"}
        </span>
        <ChevronsUpDown className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher par nom ou immatriculation…" />
          <CommandList>
            <CommandEmpty>Aucun véhicule trouvé.</CommandEmpty>
            <CommandGroup>
              {vehicles.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`${v.name} ${v.registration}`}
                  onSelect={() => {
                    onChange(v.id)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("size-4", value === v.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{v.name}</span>
                    <span className="truncate font-mono text-xs text-muted-foreground">{v.registration}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
