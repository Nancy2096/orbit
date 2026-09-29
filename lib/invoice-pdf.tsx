import "server-only"

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"

export const runtime = "nodejs"

export interface InvoicePdfItem {
  description: string | null
  service_name?: string | null
  quantity: number
  unit_price: number
  line_total: number
}

export interface InvoicePdfData {
  invoice_number: string
  issue_date: string | null
  due_date: string | null
  currency_code: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  notes: string | null
  agency: {
    name: string
    legal_name: string | null
    tax_id: string | null
    address: string | null
    phone: string | null
    email: string | null
    primary_color: string
    secondary_color: string
    text_color: string
  }
  client: {
    company_name: string
    rfc: string | null
    address: string | null
    email: string | null
  }
  items: InvoicePdfItem[]
}

// Formatea un monto con el código de moneda del gasto/factura (p. ej. "$1,234.00 MXN").
function formatMoney(amount: number, code: string): string {
  const formatted = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
  return `$${formatted} ${code}`
}

// Fecha en formato es-MX, zona America/Mexico_City, sin doble punto.
function formatDate(value: string | null): string {
  if (!value) return "-"
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(date)
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const { agency, client, items } = data
  const primary = agency.primary_color || "#0f172a"
  const secondary = agency.secondary_color || "#64748b"
  const text = agency.text_color || "#0f172a"

  const styles = StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 36,
      fontSize: 10,
      color: text,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 3,
      borderBottomColor: primary,
      paddingBottom: 12,
      marginBottom: 16,
    },
    agencyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: primary },
    small: { fontSize: 8, color: text, marginTop: 2 },
    invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: primary, textAlign: "right" },
    invoiceNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", color: text, textAlign: "right", marginTop: 2 },
    metaRight: { fontSize: 8, color: text, textAlign: "right", marginTop: 2 },
    section: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    billBox: { width: "60%" },
    boxHeading: { fontSize: 9, fontFamily: "Helvetica-Bold", color: secondary, textTransform: "uppercase", marginBottom: 4 },
    totalBox: { width: "35%", padding: 10, borderRadius: 4, backgroundColor: `${primary}15`, alignItems: "flex-end" },
    totalLabel: { fontSize: 9, color: text },
    totalValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: primary, marginTop: 2 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: primary,
      color: "#ffffff",
      paddingVertical: 6,
      paddingHorizontal: 8,
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
    },
    row: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: `${secondary}30` },
    colDesc: { width: "50%" },
    colQty: { width: "12%", textAlign: "center" },
    colPrice: { width: "19%", textAlign: "right" },
    colTotal: { width: "19%", textAlign: "right" },
    serviceName: { fontSize: 8, color: `${text}99`, marginTop: 1 },
    totalsWrap: { marginTop: 12, alignItems: "flex-end" },
    totalsRow: { flexDirection: "row", width: "45%", justifyContent: "space-between", paddingVertical: 2 },
    totalsRowStrong: {
      flexDirection: "row",
      width: "45%",
      justifyContent: "space-between",
      paddingTop: 6,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: primary,
    },
    strong: { fontFamily: "Helvetica-Bold", color: primary },
    notes: { marginTop: 20, padding: 8, borderRadius: 4, backgroundColor: `${secondary}12` },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 36,
      right: 36,
      textAlign: "center",
      fontSize: 8,
      color: secondary,
      borderTopWidth: 1,
      borderTopColor: `${primary}20`,
      paddingTop: 8,
    },
  })

  const buffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.agencyName}>{agency.legal_name || agency.name}</Text>
            {agency.tax_id ? <Text style={styles.small}>RFC: {agency.tax_id}</Text> : null}
            {agency.address ? <Text style={styles.small}>{agency.address}</Text> : null}
            {agency.phone ? <Text style={styles.small}>Tel: {agency.phone}</Text> : null}
            {agency.email ? <Text style={styles.small}>{agency.email}</Text> : null}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNumber}>{data.invoice_number}</Text>
            <Text style={styles.metaRight}>Fecha: {formatDate(data.issue_date)}</Text>
            {data.due_date ? <Text style={styles.metaRight}>Vence: {formatDate(data.due_date)}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.billBox}>
            <Text style={styles.boxHeading}>Facturar a</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{client.company_name}</Text>
            {client.rfc ? <Text style={styles.small}>RFC: {client.rfc}</Text> : null}
            {client.address ? <Text style={styles.small}>{client.address}</Text> : null}
            {client.email ? <Text style={styles.small}>{client.email}</Text> : null}
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>{formatMoney(data.total_amount, data.currency_code)}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descripción</Text>
          <Text style={styles.colQty}>Cant.</Text>
          <Text style={styles.colPrice}>P. Unitario</Text>
          <Text style={styles.colTotal}>Importe</Text>
        </View>
        {items.map((item, index) => (
          <View style={styles.row} key={index} wrap={false}>
            <View style={styles.colDesc}>
              <Text>{item.description || item.service_name || "-"}</Text>
              {item.service_name && item.description ? (
                <Text style={styles.serviceName}>{item.service_name}</Text>
              ) : null}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatMoney(item.unit_price, data.currency_code)}</Text>
            <Text style={styles.colTotal}>{formatMoney(item.line_total, data.currency_code)}</Text>
          </View>
        ))}

        <View style={styles.totalsWrap}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(data.subtotal, data.currency_code)}</Text>
          </View>
          {Number(data.discount_amount) > 0 ? (
            <View style={styles.totalsRow}>
              <Text>Descuento</Text>
              <Text>-{formatMoney(data.discount_amount, data.currency_code)}</Text>
            </View>
          ) : null}
          <View style={styles.totalsRow}>
            <Text>IVA</Text>
            <Text>{formatMoney(data.tax_amount, data.currency_code)}</Text>
          </View>
          <View style={styles.totalsRowStrong}>
            <Text style={styles.strong}>Total</Text>
            <Text style={styles.strong}>{formatMoney(data.total_amount, data.currency_code)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.boxHeading}>Notas</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Gracias por su preferencia — {agency.name}
        </Text>
      </Page>
    </Document>,
  )

  return buffer
}
