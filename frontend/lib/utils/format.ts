import { differenceInCalendarDays, differenceInMinutes, format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

export function formatDate(value?: string, pattern = "dd/MM/yyyy") {
  if (!value) return "—"
  const date = parseISO(value)
  if (!isValid(date)) return "—"
  return format(date, pattern, { locale: fr })
}

export function formatDateTime(value?: string) {
  if (!value) return "—"
  const date = parseISO(value)
  if (!isValid(date)) return "—"
  return format(date, "dd/MM/yyyy 'à' HH:mm", { locale: fr })
}

export function formatTime(value?: string) {
  if (!value) return "—"
  const date = parseISO(value)
  if (!isValid(date)) return "—"
  return format(date, "HH:mm", { locale: fr })
}

export function formatCurrency(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value)
}

export interface MissionDuration {
  valid: boolean
  days: number
  totalMinutes: number
  label: string
}

export function computeDuration(
  departureDate?: string,
  departureTime?: string,
  returnDate?: string,
  returnTime?: string,
): MissionDuration {
  if (!departureDate || !returnDate) {
    return { valid: false, days: 0, totalMinutes: 0, label: "—" }
  }
  const start = parseISO(`${departureDate}T${departureTime || "00:00"}`)
  const end = parseISO(`${returnDate}T${returnTime || "00:00"}`)
  if (!isValid(start) || !isValid(end)) {
    return { valid: false, days: 0, totalMinutes: 0, label: "—" }
  }
  const totalMinutes = differenceInMinutes(end, start)
  if (totalMinutes < 0) {
    return { valid: false, days: 0, totalMinutes, label: "Dates incohérentes" }
  }
  const days = differenceInCalendarDays(end, start) + 1
  const d = Math.floor(totalMinutes / 1440)
  const h = Math.floor((totalMinutes % 1440) / 60)
  const m = totalMinutes % 60
  const parts: string[] = []
  if (d) parts.push(`${d} j`)
  if (h) parts.push(`${h} h`)
  if (m) parts.push(`${m} min`)
  return {
    valid: true,
    days,
    totalMinutes,
    label: parts.length ? parts.join(" ") : "0 min",
  }
}

export function pluralDays(days: number) {
  return `${days} jour${days > 1 ? "s" : ""}`
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}
