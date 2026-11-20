function csvCell(value) {
  const text = String(value ?? '')
  const safeText = /^[\t ]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

export function toCsv(rows, columns) {
  const header = columns.map((column) => csvCell(column.label)).join(',')
  const values = rows.map((row) =>
    columns.map((column) => csvCell(row[column.key])).join(','),
  )

  return [header, ...values].join('\r\n')
}
