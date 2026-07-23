import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { BASE } from '../api'

pdfMake.addVirtualFileSystem(pdfFonts)

const ACCENT   = '#4282c2'
const INK_900  = '#14213d'
const INK_500  = '#67809a'
const LINE     = '#e4e7eb'
const STRIPE   = '#f5f7fa'

const PAGE_MARGIN = 40
const CONTENT_W   = 515.28 // A4 (595.28) menos márgenes izq/der
const HEADER_H     = 100

const fetchAsDataUrl = (url) => fetch(url)
  .then(r => { if (!r.ok) throw new Error('No se pudo cargar la imagen'); return r.blob() })
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }))

export async function generateOrderPdf(order) {
  let photo = null
  if (order.photoUrl) {
    try { photo = await fetchAsDataUrl(`${BASE}${order.photoUrl}`) } catch { photo = null }
  }

  const rows = [
    ['Código',   order.code],
    ['Producto', order.product],
    ['Operador', order.operator],
    ['Fecha',    order.scheduledAt ? new Date(order.scheduledAt).toLocaleString('es-CO') : '—'],
  ]

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    info: { title: `Orden ${order.code}` },
    content: [
      // Header — empresa y sede, con patrón decorativo a la derecha
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: CONTENT_W, h: HEADER_H, color: ACCENT },
          { type: 'ellipse', x: CONTENT_W - 10,  y: HEADER_H / 2 - 8,  r1: 90, r2: 90, color: '#ffffff', fillOpacity: 0.06 },
          { type: 'ellipse', x: CONTENT_W - 60,  y: HEADER_H / 2 + 20, r1: 52, r2: 52, color: '#ffffff', fillOpacity: 0.09 },
          { type: 'ellipse', x: CONTENT_W - 95,  y: HEADER_H / 2 - 30, r1: 26, r2: 26, color: '#ffffff', fillOpacity: 0.13 },
          { type: 'ellipse', x: CONTENT_W - 140, y: HEADER_H / 2 + 8,  r1: 12, r2: 12, color: '#ffffff', fillOpacity: 0.16 },
        ],
      },
      {
        absolutePosition: { x: PAGE_MARGIN + 22, y: PAGE_MARGIN + 18 },
        stack: [
          { text: 'SISTEMA CONEXA', color: '#dbe9f6', fontSize: 9, bold: true },
          { text: 'LÁMINAS & DOBLECES', color: '#ffffff', fontSize: 20, bold: true, margin: [0, 5, 0, 6] },
          { text: `Sede ${order.sedeInfo?.name || order.sede}${order.sedeInfo?.city ? ' · ' + order.sedeInfo.city + ', Colombia' : ''}`, color: '#dbe9f6', fontSize: 11 },
        ],
      },

      // Tabla de info
      { text: 'DATOS DE LA ORDEN', style: 'sectionLabel', margin: [0, 22, 0, 8] },
      {
        table: {
          widths: [130, '*'],
          body: rows.map(([label, value], i) => ([
            { text: label.toUpperCase(), style: 'rowLabel', fillColor: i % 2 ? STRIPE : '#ffffff' },
            { text: (value ?? '') !== '' ? String(value) : '—', style: 'rowValue', fillColor: i % 2 ? STRIPE : '#ffffff' },
          ])),
        },
        layout: {
          hLineWidth: () => 0.6,
          vLineWidth: () => 0,
          hLineColor: () => LINE,
          paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 7, paddingBottom: () => 7,
        },
      },

      // Evidencia fotográfica
      { text: 'EVIDENCIA FOTOGRÁFICA', style: 'sectionLabel', margin: [0, 24, 0, 8] },
      photo
        ? {
            table: { widths: ['*'], body: [[{ image: photo, fit: [500, 320], alignment: 'center' }]] },
            layout: {
              hLineWidth: () => 1, vLineWidth: () => 1,
              hLineColor: () => LINE, vLineColor: () => LINE,
              paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 8, paddingBottom: () => 8,
            },
          }
        : { text: 'No hay foto registrada para esta orden.', italics: true, color: '#94a3b8', alignment: 'center', margin: [0, 14, 0, 14] },
    ],
    styles: {
      sectionLabel: { fontSize: 9, bold: true, color: INK_500 },
      rowLabel:     { fontSize: 8.5, bold: true, color: INK_500 },
      rowValue:     { fontSize: 10.5, color: INK_900 },
    },
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 0],
      columns: [
        { text: `Generado el ${new Date().toLocaleString('es-CO')}`, fontSize: 7.5, color: '#94a3b8' },
        { text: `${currentPage} / ${pageCount}`, fontSize: 7.5, color: '#94a3b8', alignment: 'right' },
      ],
    }),
    defaultStyle: { font: 'Roboto' },
  }

  pdfMake.createPdf(docDefinition).download(`orden-${order.code}.pdf`)
}
