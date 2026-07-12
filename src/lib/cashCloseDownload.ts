import type { DailyCashClose } from '../api'
import { isPastAutoCloseTime } from './cashCloseTime'

function formatCOP(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value)
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCashCloseReport(data: DailyCashClose): void {
  const company = data.companyName?.trim() || 'empresa'
  const slug = company
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const filename = `cierre-caja-${data.date}-${slug || 'empresa'}.csv`

  const lines: string[] = []
  const row = (...cells: Array<string | number | null | undefined>) =>
    lines.push(cells.map(csvEscape).join(','))

  row('Cierre de caja', data.date)
  row('Empresa', company)
  row(
    'Estado',
    data.record?.status === 'CLOSED'
      ? 'Cerrado'
      : isPastAutoCloseTime(data.date)
        ? 'Cerrado automático'
        : 'Abierto',
  )
  if (data.record?.closedAt) row('Cerrado el', data.record.closedAt)
  lines.push('')

  row('Concepto', 'Valor')
  row('Ventas', formatCOP(data.summary.salesTotalCOP))
  row('Comandas', data.summary.saleCount)
  row('Compras', formatCOP(data.summary.purchasesTotalCOP))
  row('Lotes de compra', data.summary.purchaseCount)
  row('Nómina', formatCOP(data.summary.laborTotalCOP))
  row('Neto del día', formatCOP(data.summary.netCOP))
  row('Efectivo esperado', formatCOP(data.summary.expectedCashCOP ?? 0))
  if (data.record?.openingFloatCOP != null) {
    row('Fondo inicial', formatCOP(data.record.openingFloatCOP))
  }
  if (data.record?.countedCashCOP != null) {
    row('Efectivo contado', formatCOP(data.record.countedCashCOP))
  }
  if (data.record?.varianceCOP != null) {
    row('Diferencia', formatCOP(data.record.varianceCOP))
  }
  if (data.record?.notes?.trim()) row('Notas', data.record.notes.trim())
  lines.push('')

  if (data.paymentsByMethod.length) {
    row('Método de pago', 'Total')
    for (const p of data.paymentsByMethod) {
      row(p.method, formatCOP(p.totalCOP))
    }
    lines.push('')
  }

  if (data.sales.length) {
    row('Comanda', 'Cliente', 'Método', 'Total')
    for (const sale of data.sales) {
      row(sale.code ?? sale.id, sale.customer, sale.paymentMethod, formatCOP(sale.total))
    }
    lines.push('')
  }

  if (data.purchases.length) {
    row('Compra', 'Nombre', 'Total')
    for (const lot of data.purchases) {
      row(lot.code, lot.name, formatCOP(lot.total))
    }
    lines.push('')
  }

  if (data.shifts.length) {
    row('Personal', 'Horas', 'Pago')
    for (const shift of data.shifts) {
      row(
        shift.staffName,
        shift.hoursWorked != null ? shift.hoursWorked.toFixed(1) : '',
        shift.totalPayCOP != null ? formatCOP(shift.totalPayCOP) : '',
      )
    }
  }

  downloadText(lines.join('\n'), filename, 'text/csv;charset=utf-8')
}
