export function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string,
): void {
  if (data.length === 0) {
    return
  }

  const headerRow = columns.map((c) => `"${c.label}"`).join(',')

  const bodyRows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key]
        if (val === null || val === undefined) {
          return ''
        }
        const str = String(val)
        return `"${str.replace(/"/g, '""')}"`
      })
      .join(','),
  )

  const csv = [headerRow, ...bodyRows].join('\r\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
