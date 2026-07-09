"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  PartyPopper,
  Cake,
  Star,
  Trash2,
  Pencil,
} from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDate,
  getMonth,
  setYear,
} from "date-fns"
import { es } from "date-fns/locale"

interface Holiday {
  id: string
  agency_id: string | null
  name: string
  date: string
  end_date: string | null
  is_recurring: boolean
  type: string
  description: string | null
}

interface StaffBirthday {
  id: string
  first_name: string
  last_name: string
  position: string | null
  photo_url: string | null
  birth_date: string
}

type CalItemType = "holiday" | "event" | "birthday"

interface CalItem {
  key: string
  type: CalItemType
  title: string
  subtitle?: string
  date: Date // fecha proyectada en el año visible
  raw?: Holiday | StaffBirthday
}

const TYPE_STYLES: Record<CalItemType, { label: string; dot: string; badge: string; icon: typeof Star }> = {
  holiday: {
    label: "Día festivo",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 hover:bg-red-100",
    icon: PartyPopper,
  },
  event: {
    label: "Evento",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    icon: Star,
  },
  birthday: {
    label: "Cumpleaños",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    icon: Cake,
  },
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export default function CalendarPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [birthdays, setBirthdays] = useState<StaffBirthday[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterType, setFilterType] = useState<string>("all")
  // Modo administrativo: solo activo al entrar desde el Dashboard RH (?admin=1).
  // Desde el menú lateral la vista es solo informativa.
  const [isAdmin, setIsAdmin] = useState(false)

  // Diálogo para agregar/eliminar fechas importantes
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Si tiene valor, el diálogo está en modo edición de ese festivo/evento.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    date: "",
    end_date: "",
    type: "holiday" as "holiday" | "event",
    description: "",
    is_recurring: false,
  })

  useEffect(() => {
    load()
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setIsAdmin(params.get("admin") === "1")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const [{ data: holidayData }, { data: staffData }] = await Promise.all([
      supabase
        .from("holidays")
        .select("id, agency_id, name, date, end_date, is_recurring, type, description")
        .order("date"),
      supabase
        .from("staff")
        .select("id, first_name, last_name, position, photo_url, birth_date")
        .eq("is_active", true)
        .not("birth_date", "is", null),
    ])
    if (holidayData) setHolidays(holidayData as Holiday[])
    if (staffData) setBirthdays(staffData as StaffBirthday[])
    setLoading(false)
  }

  const visibleYear = currentDate.getFullYear()

  // Proyecta todos los items al año visible (festivos recurrentes y cumpleaños se repiten cada año)
  const allItems = useMemo<CalItem[]>(() => {
    const items: CalItem[] = []

    holidays.forEach((h) => {
      const base = new Date(`${h.date}T00:00:00`)
      const start = h.is_recurring ? setYear(base, visibleYear) : base
      const type: CalItemType = h.type === "event" ? "event" : "holiday"

      // Si tiene fecha de fin, se expande a cada día del rango
      let end = start
      if (h.end_date) {
        const rawEnd = new Date(`${h.end_date}T00:00:00`)
        end = h.is_recurring ? setYear(rawEnd, visibleYear) : rawEnd
      }
      if (end < start) end = start

      const rangeDays = eachDayOfInterval({ start, end })
      const isRange = rangeDays.length > 1
      rangeDays.forEach((day, idx) => {
        items.push({
          key: `h-${h.id}-${idx}`,
          type,
          title: isRange ? `${h.name} (${idx + 1}/${rangeDays.length})` : h.name,
          subtitle: h.description || undefined,
          date: day,
          raw: h,
        })
      })
    })

    birthdays.forEach((s) => {
      const base = new Date(`${s.birth_date}T00:00:00`)
      const projected = setYear(base, visibleYear)
      items.push({
        key: `b-${s.id}`,
        type: "birthday",
        title: `${s.first_name} ${s.last_name}`,
        subtitle: s.position || "Cumpleaños",
        date: projected,
        raw: s,
      })
    })

    return items
  }, [holidays, birthdays, visibleYear])

  const filteredItems = useMemo(
    () => (filterType === "all" ? allItems : allItems.filter((i) => i.type === filterType)),
    [allItems, filterType],
  )

  // Items agrupados por día (clave: yyyy-MM-dd)
  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalItem[]>()
    filteredItems.forEach((i) => {
      const key = format(i.date, "yyyy-MM-dd")
      const arr = map.get(key) || []
      arr.push(i)
      map.set(key, arr)
    })
    return map
  }, [filteredItems])

  // Días de la grilla (semana empieza lunes)
  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Fechas del mes visible ordenadas para el panel lateral
  const monthItems = useMemo(() => {
    return filteredItems
      .filter((i) => getMonth(i.date) === getMonth(currentDate) && i.date.getFullYear() === visibleYear)
      .sort((a, b) => getDate(a.date) - getDate(b.date))
  }, [filteredItems, currentDate, visibleYear])

  // KPIs del mes
  const monthStats = useMemo(() => {
    const holidaysCount = monthItems.filter((i) => i.type === "holiday").length
    const eventsCount = monthItems.filter((i) => i.type === "event").length
    const birthdaysCount = monthItems.filter((i) => i.type === "birthday").length
    return { holidaysCount, eventsCount, birthdaysCount }
  }, [monthItems])

  const today = new Date()

  const emptyForm = { name: "", date: "", end_date: "", type: "holiday" as "holiday" | "event", description: "", is_recurring: false }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setSaveError(null)
    setShowDialog(true)
  }

  function openEdit(holiday: Holiday) {
    setEditingId(holiday.id)
    setForm({
      name: holiday.name,
      date: holiday.date,
      end_date: holiday.end_date || "",
      type: holiday.type === "event" ? "event" : "holiday",
      description: holiday.description || "",
      is_recurring: holiday.is_recurring,
    })
    setSaveError(null)
    setShowDialog(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.date) return
    setSaving(true)
    setSaveError(null)
    // La fecha de fin es opcional; si es anterior al inicio, se ignora
    const endDate = form.end_date && form.end_date >= form.date ? form.end_date : null
    const payload = {
      name: form.name.trim(),
      date: form.date,
      end_date: endDate,
      type: form.type,
      description: form.description.trim() || null,
      is_recurring: form.is_recurring,
    }
    const { error } = editingId
      ? await supabase.from("holidays").update(payload).eq("id", editingId)
      : await supabase.from("holidays").insert({ ...payload, agency_id: null }) // global para toda la organización
    setSaving(false)
    if (error) {
      setSaveError(error.message || "No se pudo guardar la fecha. Intenta de nuevo.")
      return
    }
    setShowDialog(false)
    setEditingId(null)
    setForm(emptyForm)
    load()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error } = await supabase.from("holidays").delete().eq("id", id)
    setDeletingId(null)
    if (!error) load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <CalendarDays className="h-6 w-6 text-primary" />
            Calendario
          </h1>
          <p className="text-muted-foreground">
            Días festivos, eventos y cumpleaños del personal activo de toda la organización
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar fecha
          </Button>
        )}
      </div>

      {/* Indicadores del mes */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <PartyPopper className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthStats.holidaysCount}</p>
              <p className="text-xs text-muted-foreground">Días festivos este mes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthStats.eventsCount}</p>
              <p className="text-xs text-muted-foreground">Eventos este mes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Cake className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthStats.birthdaysCount}</p>
              <p className="text-xs text-muted-foreground">Cumpleaños este mes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Calendario */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => subMonths(d, 1))}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Mes anterior</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate((d) => addMonths(d, 1))}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Mes siguiente</span>
              </Button>
              <CardTitle className="ml-1 text-lg capitalize">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="holiday">Festivos</SelectItem>
                  <SelectItem value="event">Eventos</SelectItem>
                  <SelectItem value="birthday">Cumpleaños</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabecera de días */}
            <div className="grid grid-cols-7 gap-1 border-b pb-2 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            {/* Grilla */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {gridDays.map((day) => {
                const key = format(day, "yyyy-MM-dd")
                const dayItems = itemsByDay.get(key) || []
                const inMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, today)
                return (
                  <div
                    key={key}
                    className={`min-h-[92px] rounded-lg border p-1.5 transition-colors ${
                      inMonth ? "bg-card" : "bg-muted/40"
                    } ${isToday ? "border-primary ring-1 ring-primary" : "border-border"}`}
                  >
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {getDate(day)}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayItems.slice(0, 3).map((item) => {
                        const style = TYPE_STYLES[item.type]
                        const Icon = style.icon
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] ${style.badge}`}
                            title={item.title}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </div>
                        )
                      })}
                      {dayItems.length > 3 && (
                        <span className="pl-1 text-[10px] text-muted-foreground">+{dayItems.length - 3} más</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
              {(Object.keys(TYPE_STYLES) as CalItemType[]).map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${TYPE_STYLES[t].dot}`} />
                  {TYPE_STYLES[t].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel lateral: fechas del mes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg capitalize">
              Fechas de {format(currentDate, "MMMM", { locale: es })}
            </CardTitle>
            <CardDescription>Festivos, eventos y cumpleaños del mes</CardDescription>
          </CardHeader>
          <CardContent>
            {monthItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay fechas registradas este mes</p>
            ) : (
              <div className="flex flex-col gap-2">
                {monthItems.map((item) => {
                  const style = TYPE_STYLES[item.type]
                  const Icon = style.icon
                  const holiday = item.type !== "birthday" ? (item.raw as Holiday) : null
                  return (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="flex flex-col items-center justify-center rounded-md bg-muted px-2 py-1">
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {format(item.date, "MMM", { locale: es })}
                        </span>
                        <span className="text-lg font-bold leading-none">{getDate(item.date)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate font-medium">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                        )}
                        <Badge className={`mt-1 ${style.badge}`}>{style.label}</Badge>
                      </div>
                      {holiday && isAdmin && (
                        <div className="flex shrink-0 items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => openEdit(holiday)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDelete(holiday.id)}
                            disabled={deletingId === holiday.id}
                          >
                            {deletingId === holiday.id ? (
                              <Spinner className="h-3.5 w-3.5" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo agregar fecha importante */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar fecha importante" : "Agregar fecha importante"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Modifica los datos de este día festivo o evento."
                : "Registra un día festivo o evento para toda la organización."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cal-name">Nombre</Label>
              <Input
                id="cal-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Día de la Independencia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cal-date">Desde</Label>
                <Input
                  id="cal-date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                      // Si el fin queda antes del inicio, se limpia
                      end_date: form.end_date && form.end_date < e.target.value ? "" : form.end_date,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cal-end-date">Hasta (opcional)</Label>
                <Input
                  id="cal-end-date"
                  type="date"
                  min={form.date || undefined}
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cal-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "holiday" | "event" })}
              >
                <SelectTrigger id="cal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">Día festivo</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cal-desc">Descripción (opcional)</Label>
              <Textarea
                id="cal-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalles del festivo o evento"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="cal-recurring">Se repite cada año</Label>
                <p className="text-xs text-muted-foreground">Actívalo para fechas anuales fijas</p>
              </div>
              <Switch
                id="cal-recurring"
                checked={form.is_recurring}
                onCheckedChange={(v) => setForm({ ...form, is_recurring: v })}
              />
            </div>
            {saveError && (
              <p className="text-sm text-red-600" role="alert">
                {saveError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.date}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {editingId ? "Guardar cambios" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
