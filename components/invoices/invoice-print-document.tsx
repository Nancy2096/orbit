"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { DocumentPalette } from "@/lib/document-colors"

export interface PrintableInvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  service?: { name: string } | null
}

export interface PrintableInvoice {
  invoice_number: string
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  tax_rate: number
  discount_amount: number
  total_amount: number
  notes: string | null
  client: {
    company_name: string
    legal_name?: string | null
    rfc?: string | null
    email?: string | null
    address?: string | null
  } | null
  agency: {
    name: string
    legal_name: string | null
    tax_id: string | null
    address: string | null
    phone: string | null
    email: string | null
    website: string | null
  } | null
  currency: { code: string } | null
}

interface DocumentProps {
  invoice: PrintableInvoice
  items: PrintableInvoiceItem[]
  palette: DocumentPalette
  logoUrl: string | null
  tagline?: string | null
  fontFamily?: string | null
  sourceNotes: string | null
  formatCurrency: (amount: number) => string
  formatDate: (value: string | null) => string
}

function AgencyMark({ invoice, palette, logoUrl, size }: Pick<DocumentProps, "invoice" | "palette" | "logoUrl"> & { size: "sm" | "lg" }) {
  const box = size === "lg" ? "h-20 w-20 text-2xl" : "h-16 w-16 text-xl"
  if (logoUrl) {
    return <img src={logoUrl} alt={invoice.agency?.name || ""} className={`${size === "lg" ? "h-20" : "h-16"} w-auto object-contain`} />
  }
  return (
    <div
      className={`${box} flex items-center justify-center rounded-lg font-bold`}
      style={{ backgroundColor: palette.brand, color: palette.onBrand }}
      aria-hidden="true"
    >
      {invoice.agency?.name?.charAt(0) || "A"}
    </div>
  )
}

/** Full invoice rendered only when printing (browser "Guardar como PDF"). */
export function InvoicePrintDocument(props: DocumentProps) {
  const { invoice, items, palette, logoUrl, tagline, fontFamily, sourceNotes, formatCurrency, formatDate } = props
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Mounted as a direct child of <body> so print CSS can hide the rest of the app with display:none;
  // hiding with visibility kept the dashboard's height and produced trailing blank pages.
  useEffect(() => setContainer(document.body), [])
  if (!container) return null

  const { text, textMuted, border } = palette

  return createPortal(
    <div id="printable-invoice" className="hidden bg-white" style={{ fontFamily: fontFamily || undefined, color: text }}>
      <div className="h-2 w-full rounded-sm mb-6" style={{ backgroundColor: palette.brand }} />

      <div className="flex justify-between items-start mb-8 border-b pb-6" style={{ borderColor: palette.brandBorder }}>
        <div className="flex items-center gap-4">
          <AgencyMark invoice={invoice} palette={palette} logoUrl={logoUrl} size="lg" />
          <div>
            <h2 className="text-2xl font-bold" style={{ color: text }}>
              {invoice.agency?.legal_name || invoice.agency?.name}
            </h2>
            {tagline && <p className="text-sm italic" style={{ color: textMuted }}>{tagline}</p>}
            {invoice.agency?.tax_id && <p className="text-sm" style={{ color: textMuted }}>RFC: {invoice.agency.tax_id}</p>}
            {invoice.agency?.address && <p className="text-sm" style={{ color: textMuted }}>{invoice.agency.address}</p>}
            {invoice.agency?.phone && <p className="text-sm" style={{ color: textMuted }}>Tel: {invoice.agency.phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-bold" style={{ color: palette.brandText }}>FACTURA</h1>
          <p className="text-2xl font-semibold mt-2" style={{ color: palette.brandOrText }}>{invoice.invoice_number}</p>
          <div className="mt-3 text-sm" style={{ color: textMuted }}>
            <p>Fecha: {formatDate(invoice.issue_date)}</p>
            <p>Vencimiento: {formatDate(invoice.due_date)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 print-avoid-break">
        <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: palette.brandSoft, borderColor: palette.brand }}>
          <h3 className="font-bold text-sm mb-2 uppercase" style={{ color: textMuted }}>Facturar a:</h3>
          <p className="font-bold text-lg" style={{ color: text }}>{invoice.client?.legal_name || invoice.client?.company_name}</p>
          {invoice.client?.rfc && <p className="text-sm" style={{ color: textMuted }}>RFC: {invoice.client.rfc}</p>}
          {invoice.client?.address && <p className="text-sm" style={{ color: textMuted }}>{invoice.client.address}</p>}
          {invoice.client?.email && <p className="text-sm" style={{ color: textMuted }}>{invoice.client.email}</p>}
        </div>
        <div className="text-right">
          <div className="inline-block p-4 rounded-lg border" style={{ backgroundColor: palette.brandSoft, borderColor: palette.brandBorder }}>
            <p className="text-sm" style={{ color: textMuted }}>Total a Pagar</p>
            <p className="text-4xl font-bold" style={{ color: text }}>{formatCurrency(invoice.total_amount)}</p>
            <p className="text-sm" style={{ color: textMuted }}>{invoice.currency?.code || "MXN"}</p>
          </div>
        </div>
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr style={{ backgroundColor: palette.brand, color: palette.onBrand }}>
            <th className="text-left py-3 px-4">Descripción</th>
            <th className="text-center py-3 px-4">Cant.</th>
            <th className="text-right py-3 px-4">Precio Unit.</th>
            <th className="text-right py-3 px-4">Importe</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b" style={{ borderColor: border, color: text }}>
              <td className="py-3 px-4">
                {item.description}
                {item.service && <span className="text-sm block" style={{ color: textMuted }}>{item.service.name}</span>}
              </td>
              <td className="text-center py-3 px-4">{item.quantity}</td>
              <td className="text-right py-3 px-4">{formatCurrency(item.unit_price)}</td>
              <td className="text-right py-3 px-4">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8 print-avoid-break">
        <div className="w-72 border rounded-lg overflow-hidden" style={{ borderColor: palette.brandBorder, color: text }}>
          <div className="flex justify-between py-2 px-4">
            <span style={{ color: textMuted }}>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between py-2 px-4">
              <span style={{ color: textMuted }}>Descuento:</span>
              <span>-{formatCurrency(invoice.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 px-4">
            <span style={{ color: textMuted }}>IVA ({invoice.tax_rate || 16}%):</span>
            <span>{formatCurrency(invoice.tax_amount)}</span>
          </div>
          <div
            className="flex justify-between py-3 px-4 font-bold text-lg border-t-2"
            style={{ backgroundColor: palette.brandSoft, borderColor: palette.brand }}
          >
            <span>Total:</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {(sourceNotes || invoice.notes) && (
        <div className="mb-6 p-4 rounded-lg border print-avoid-break" style={{ borderColor: palette.brandBorder, color: text }}>
          <h4 className="font-bold text-sm mb-1">Notas:</h4>
          {sourceNotes && <p className="text-sm whitespace-pre-line">{sourceNotes}</p>}
          {invoice.notes && <p className="text-sm whitespace-pre-line mt-2 first:mt-0">{invoice.notes}</p>}
        </div>
      )}

      <div className="mt-8 pt-6 border-t text-center text-sm print-avoid-break" style={{ borderColor: palette.brandBorder, color: textMuted }}>
        <p className="font-semibold text-lg" style={{ color: text }}>Gracias por su preferencia</p>
        {tagline && <p className="italic mt-1">{tagline}</p>}
        <p className="mt-3 font-medium">{invoice.agency?.name}</p>
        {invoice.agency?.website && <p>{invoice.agency.website}</p>}
        {invoice.agency?.email && <p>{invoice.agency.email}</p>}
        {invoice.agency?.phone && <p>Tel: {invoice.agency.phone}</p>}
      </div>

      <style>{`
        @media print {
          body > *:not(#printable-invoice) { display: none !important; }
          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          #printable-invoice {
            display: block !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #printable-invoice tr,
          #printable-invoice .print-avoid-break { break-inside: avoid; }
          @page { size: letter; margin: 15mm; }
        }
      `}</style>
    </div>,
    container,
  )
}

/** Short on-screen preview shown in the "Vista Previa de Factura" dialog. */
export function InvoicePreviewDocument(props: DocumentProps) {
  const { invoice, items, palette, logoUrl, tagline, fontFamily, formatCurrency, formatDate } = props
  const { text, textMuted } = palette

  return (
    <div className="border rounded-lg p-8 bg-white shadow-sm" style={{ fontFamily: fontFamily || undefined, color: text }}>
      <div className="h-1.5 w-full rounded-sm mb-4" style={{ backgroundColor: palette.brand }} />
      <div className="flex justify-between items-start mb-6 border-b pb-4" style={{ borderColor: palette.brandBorder }}>
        <div className="flex items-center gap-4">
          <AgencyMark invoice={invoice} palette={palette} logoUrl={logoUrl} size="sm" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: text }}>{invoice.agency?.legal_name || invoice.agency?.name}</h2>
            {tagline && <p className="text-xs italic" style={{ color: textMuted }}>{tagline}</p>}
            {invoice.agency?.tax_id && <p className="text-xs" style={{ color: textMuted }}>RFC: {invoice.agency.tax_id}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold" style={{ color: palette.brandText }}>FACTURA</h1>
          <p className="text-lg font-semibold" style={{ color: palette.brandOrText }}>{invoice.invoice_number}</p>
          <p className="text-xs mt-1" style={{ color: textMuted }}>Fecha: {formatDate(invoice.issue_date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-3 rounded-lg border-l-4" style={{ backgroundColor: palette.brandSoft, borderColor: palette.brand }}>
          <h3 className="font-bold text-xs mb-1 uppercase" style={{ color: textMuted }}>Facturar a:</h3>
          <p className="font-medium text-sm">{invoice.client?.company_name}</p>
          {invoice.client?.address && <p className="text-xs" style={{ color: textMuted }}>{invoice.client.address}</p>}
        </div>
        <div className="text-right">
          <div className="inline-block p-3 rounded-lg border" style={{ backgroundColor: palette.brandSoft, borderColor: palette.brandBorder }}>
            <p className="text-xs" style={{ color: textMuted }}>Total</p>
            <p className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg overflow-hidden border" style={{ borderColor: palette.brandBorder }}>
        <div className="py-2 px-4 text-xs font-medium" style={{ backgroundColor: palette.brand, color: palette.onBrand }}>
          {items.length} partida{items.length !== 1 ? "s" : ""} en esta factura
        </div>
        <div className="p-3 text-xs">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between py-1">
              <span className="truncate mr-4">{item.description}</span>
              <span className="font-medium">{formatCurrency(item.total)}</span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-center mt-2 italic" style={{ color: textMuted }}>
              ...y {items.length - 3} partida{items.length - 3 !== 1 ? "s" : ""} más
            </p>
          )}
        </div>
      </div>

      <div className="text-center pt-4 border-t" style={{ borderColor: palette.brandBorder }}>
        <p className="font-semibold text-sm">Gracias por su preferencia</p>
        {tagline && <p className="text-xs italic" style={{ color: textMuted }}>{tagline}</p>}
      </div>
    </div>
  )
}
