import { getEntryPayment, type PaymentEntryLike } from "@/lib/payroll-currency"

export interface PayrollBreakdownItem {
  staff_id: string
  name: string
  net_pay: number
  pay_code: string
  rate: number
  amount: number
}

export interface PayrollBreakdown {
  source: "registro" | "reconstruido"
  bank_code: string
  items: PayrollBreakdownItem[]
}

type BreakdownEntry = PaymentEntryLike & {
  staff_id: string
  staff?: (PaymentEntryLike["staff"] & { first_name?: string; last_name?: string }) | null
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Monto que sale del banco por colaborador, en la moneda del BANCO: si el
// colaborador cobra en esa moneda se usa su monto de pago (p. ej. USD); si el
// banco es en pesos se usa el neto en pesos.
export function buildPayrollBreakdownItems(
  entries: BreakdownEntry[],
  bankCode: string,
  codeById: (id: string | null | undefined) => string,
): PayrollBreakdownItem[] {
  return entries
    .filter((e) => (Number(e.net_pay) || 0) > 0)
    .map((e) => {
      const pay = getEntryPayment(e, codeById)
      const net = Number(e.net_pay) || 0
      const useNet = pay.code !== bankCode && bankCode === "MXN"
      return {
        staff_id: e.staff_id,
        name: `${e.staff?.first_name ?? ""} ${e.staff?.last_name ?? ""}`.replace(/\s+/g, " ").trim() || "Colaborador",
        net_pay: round2(net),
        pay_code: useNet ? "MXN" : pay.code,
        rate: useNet ? 0 : round2(pay.rate * 10000) / 10000,
        amount: round2(useNet ? net : pay.amount),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
}

export const sumBreakdown = (items: PayrollBreakdownItem[]) => round2(items.reduce((s, i) => s + i.amount, 0))
