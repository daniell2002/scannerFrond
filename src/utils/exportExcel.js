// Exportación a Excel (.xlsx). exceljs pesa ~1 MB: se descarga solo al exportar.

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A78D6' } }
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } }

const fmtDateTime = (iso) => iso ? new Date(iso) : null
const today = () => new Date().toISOString().slice(0, 10)

/**
 * Hoja con encabezado, filtros y la primera fila fija.
 * columns: [{ header, key, width, numFmt? }]
 */
function addSheet(wb, name, columns, rows) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = columns.map(({ header, key, width = 16, numFmt }) => ({ header, key, width, style: numFmt ? { numFmt } : {} }))
  ws.addRows(rows)
  const head = ws.getRow(1)
  head.font = HEADER_FONT
  head.fill = HEADER_FILL
  head.alignment = { vertical: 'middle' }
  head.height = 20
  if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  return ws
}

async function download(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function newWorkbook() {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Conexa'
  wb.created = new Date()
  return wb
}

const ORDER_COLUMNS = [
  { header: 'Orden',            key: 'code',       width: 16 },
  { header: 'Cliente',          key: 'product',    width: 28 },
  { header: 'Sede',             key: 'sede',       width: 22 },
  { header: 'Registrada por',   key: 'operator',   width: 22 },
  { header: 'Atendido por',     key: 'attendedBy', width: 22 },
  { header: 'Estado',           key: 'status',     width: 14 },
  { header: 'Prioridad',        key: 'priority',   width: 11 },
  { header: 'Fecha',            key: 'date',       width: 18, numFmt: 'dd/mm/yyyy hh:mm' },
  { header: 'Revisión',         key: 'review',     width: 14 },
  { header: 'Veces registrada', key: 'scanCount',  width: 10 },
  { header: 'Fotos',            key: 'photos',     width: 8 },
]

const orderRow = (o) => ({
  code:       o.code,
  product:    o.product,
  sede:       o.sedeInfo?.name || o.sede,
  operator:   o.operator,
  attendedBy: o.attendedBy || '',
  status:     o.status,
  priority:   o.priority,
  date:       fmtDateTime(o.scannedAt || o.scheduledAt),
  review:     o.pendingReview ? 'Por revisar' : 'Revisada',
  scanCount:  o.scanCount,
  photos:     o.photos?.length || 0,
})

/** Lista de órdenes (p. ej. el historial con los filtros aplicados). */
export async function exportOrders(orders, { name = 'ordenes' } = {}) {
  const wb = await newWorkbook()
  addSheet(wb, 'Órdenes', ORDER_COLUMNS, orders.map(orderRow))
  await download(wb, `${name}-${today()}.xlsx`)
}

/**
 * Estadísticas: resumen, órdenes por día, por sede y el detalle de todas las órdenes.
 * data: { kpis, last14, sedeHoy, sedeHist, orders }
 */
export async function exportStats({ kpis, last14, sedeHoy, sedeHist, orders }) {
  const wb = await newWorkbook()

  addSheet(wb, 'Resumen', [
    { header: 'Indicador', key: 'k', width: 30 },
    { header: 'Valor',     key: 'v', width: 14 },
  ], [
    { k: 'Órdenes hoy',              v: kpis.hoy },
    { k: 'Revisadas hoy',            v: kpis.revisadas },
    { k: 'Por revisar hoy',          v: kpis.porRevisar },
    { k: 'Órdenes en el historial',  v: kpis.historial },
    { k: 'Total general',            v: kpis.total },
    { k: 'Generado',                 v: new Date().toLocaleString('es-CO') },
  ])

  addSheet(wb, 'Por día (14 días)', [
    { header: 'Día',     key: 'long',  width: 30 },
    { header: 'Órdenes', key: 'count', width: 12 },
  ], last14.map(d => ({ long: d.long, count: d.count })))

  addSheet(wb, 'Hoy por sede', [
    { header: 'Sede',        key: 'name',       width: 26 },
    { header: 'Órdenes',     key: 'total',      width: 12 },
    { header: 'Por revisar', key: 'porRevisar', width: 14 },
  ], sedeHoy)

  addSheet(wb, 'Historial por sede', [
    { header: 'Sede',    key: 'name',  width: 26 },
    { header: 'Órdenes', key: 'total', width: 12 },
  ], sedeHist)

  addSheet(wb, 'Detalle de órdenes', ORDER_COLUMNS, orders.map(orderRow))

  await download(wb, `estadisticas-${today()}.xlsx`)
}

/** Registro de actividad. */
export async function exportActivity(items, labels) {
  const wb = await newWorkbook()
  addSheet(wb, 'Actividad', [
    { header: 'Fecha',    key: 'date',   width: 18, numFmt: 'dd/mm/yyyy hh:mm' },
    { header: 'Usuario',  key: 'actor',  width: 24 },
    { header: 'Rol',      key: 'role',   width: 14 },
    { header: 'Acción',   key: 'action', width: 18 },
    { header: 'Elemento', key: 'entity', width: 14 },
    { header: 'Detalle',  key: 'label',  width: 34 },
    { header: 'Sede',     key: 'sede',   width: 18 },
    { header: 'Cambios',  key: 'changes', width: 60 },
  ], items.map(i => ({
    date:    new Date(i.createdAt),
    actor:   i.actorName,
    role:    labels.role(i.actorRole),
    action:  labels.action(i.action),
    entity:  labels.entity(i.entity),
    label:   i.label,
    sede:    labels.sede(i.sede),
    changes: labels.changes(i.changes),
  })))
  await download(wb, `actividad-${today()}.xlsx`)
}
