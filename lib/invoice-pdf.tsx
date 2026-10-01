import "server-only"

import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"

export const runtime = "nodejs"

export interface InvoicePdfItem {
  description: string | null
  quantity: number | null
  unit_price: number | null
  subtotal: number | null
}

export interface InvoicePdfData {
  invoice_number: string
  status?: string | null
  issue_date?: string | null
  due_date?: string | null
  subtotal?: number | null
  tax_amount?: number | null
  discount_amount?: number | null
  total_amount?: number | null
  notes?: string | null
  currency?: { code?: string | null; symbol?: string | null } | null
  client?: {
    company_name?: string | null
    address?: string | null
  } | null
  agency?: {
    name?: string | null
    legal_name?: string | null
    tax_id?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
  } | null
  items: InvoicePdfItem[]
}

function formatMoney(amount: number | null | undefined, symbol: string, code: string): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  const formatted = value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted} ${code}`.trim()
}

function formatDate(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottom: "2 solid #111827",
    paddingBottom: 12,
  },
  agencyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  muted: {
    color: "#6b7280",
    fontSize: 9,
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#374151",
    textAlign: "right",
    marginTop: 2,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  block: {
    width: "48%",
  },
  label: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    fontSize: 10,
    marginBottom: 2,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111827",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottom: "1 solid #e5e7eb",
  },
  colDesc: { width: "50%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "19%", textAlign: "right" },
  colTotal: { width: "19%", textAlign: "right" },
  totals: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "50%",
    paddingVertical: 3,
  },
  totalsLabel: {
    width: "55%",
    textAlign: "right",
    paddingRight: 10,
    color: "#6b7280",
  },
  totalsValue: {
    width: "45%",
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "50%",
    paddingVertical: 6,
    marginTop: 4,
    borderTop: "2 solid #111827",
  },
  grandTotalLabel: {
    width: "55%",
    textAlign: "right",
    paddingRight: 10,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  grandTotalValue: {
    width: "45%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  notes: {
    marginTop: 28,
    paddingTop: 10,
    borderTop: "1 solid #e5e7eb",
  },
})

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const symbol = data.currency?.symbol || "$"
  const code = data.currency?.code || ""
  const agency = data.agency
  const client = data.client

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.agencyName}>{agency?.name || agency?.legal_name || "—"}</Text>
            {agency?.legal_name && agency.legal_name !== agency.name ? (
              <Text style={styles.muted}>{agency.legal_name}</Text>
            ) : null}
            {agency?.tax_id ? <Text style={styles.muted}>RFC: {agency.tax_id}</Text> : null}
            {agency?.address ? <Text style={styles.muted}>{agency.address}</Text> : null}
            {agency?.phone ? <Text style={styles.muted}>Tel: {agency.phone}</Text> : null}
            {agency?.email ? <Text style={styles.muted}>{agency.email}</Text> : null}
            {agency?.website ? <Text style={styles.muted}>{agency.website}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>{data.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.block}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{client?.company_name || "—"}</Text>
            {client?.address ? <Text style={styles.muted}>{client.address}</Text> : null}
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Fecha de emisión</Text>
            <Text style={styles.value}>{formatDate(data.issue_date)}</Text>
            <Text style={styles.label}>Fecha de vencimiento</Text>
            <Text style={styles.value}>{formatDate(data.due_date)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Concepto</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colPrice}>P. Unitario</Text>
            <Text style={styles.colTotal}>Importe</Text>
          </View>
          {data.items.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Sin conceptos</Text>
              <Text style={styles.colQty}>—</Text>
              <Text style={styles.colPrice}>—</Text>
              <Text style={styles.colTotal}>—</Text>
            </View>
          ) : (
            data.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.colDesc}>{item.description || "—"}</Text>
                <Text style={styles.colQty}>{item.quantity ?? 0}</Text>
                <Text style={styles.colPrice}>{formatMoney(item.unit_price, symbol, code)}</Text>
                <Text style={styles.colTotal}>{formatMoney(item.subtotal, symbol, code)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatMoney(data.subtotal, symbol, code)}</Text>
          </View>
          {typeof data.discount_amount === "number" && data.discount_amount > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Descuento</Text>
              <Text style={styles.totalsValue}>-{formatMoney(data.discount_amount, symbol, code)}</Text>
            </View>
          ) : null}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Impuestos</Text>
            <Text style={styles.totalsValue}>{formatMoney(data.tax_amount, symbol, code)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(data.total_amount, symbol, code)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notas</Text>
            <Text style={styles.value}>{data.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />)
}
