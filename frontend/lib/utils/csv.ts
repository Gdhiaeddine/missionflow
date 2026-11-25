export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | undefined | null
}

function escapeCell(value: string | number | undefined | null) {
  const text = value === undefined || value === null ? "" : String(value)
  if (/[";\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

/** Exports rows as a semicolon-separated UTF-8 CSV (Excel FR friendly). */
export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((c) => escapeCell(c.header)).join(";")
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(";"))
  const csv = "\uFEFF" + [header, ...body].join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
