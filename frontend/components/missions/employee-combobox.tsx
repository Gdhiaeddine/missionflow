"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Employee } from "@/types"

export function EmployeeCombobox({
  id,
  employees,
  value,
  onChange,
  invalid,
}: {
  id?: string
  employees: Employee[]
  value: string
  onChange: (id: string) => void
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = employees.find((e) => e.id === value)

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
            aria-invalid={invalid || undefined}
            className="w-full justify-between font-normal"
          />
        }
      >
        {selected ? (
          <span className="truncate">
            {selected.lastName} {selected.firstName}
            <span className="ml-2 text-muted-foreground">{selected.employeeNumber}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Rechercher par nom ou matricule…</span>
        )}
        <ChevronsUpDown data-icon="inline-end" className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Nom, prénom ou matricule…" />
          <CommandList>
            <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.lastName} ${employee.firstName} ${employee.employeeNumber} ${employee.position}`}
                  onSelect={() => {
                    onChange(employee.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">
                      {employee.lastName} {employee.firstName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {employee.employeeNumber} · {employee.position}
                    </span>
                  </div>
                  <Check className={cn("ml-auto", value === employee.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
