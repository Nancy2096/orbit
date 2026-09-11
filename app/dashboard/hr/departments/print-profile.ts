import {
  jobTypeLabel,
  levelLabel,
  profileStatusMeta,
  type Department,
  type Position,
} from "./types"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Abre una ventana con el Perfil de Cargo formateado y lanza el diálogo de
 * impresión del navegador, que permite "Guardar como PDF".
 */
export function printProfile(
  position: Position,
  department: Department | null,
  reportsToName: string | null,
) {
  const profile = position.profile
  const status = profileStatusMeta(position.profile_status)
  const win = window.open("", "_blank", "width=900,height=1000")
  if (!win) return

  const row = (label: string, value: string) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || "—")}</td></tr>`

  const functionsRows =
    profile?.functions && profile.functions.length > 0
      ? profile.functions
          .map(
            (fn) =>
              `<tr><td>${escapeHtml(fn.responsibility || "—")}</td><td>${escapeHtml(
                fn.periodicity || "—",
              )}</td><td>${escapeHtml(fn.reports || "—")}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="3">Sin funciones registradas</td></tr>`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Perfil de Cargo - ${escapeHtml(position.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 24px 0 10px; }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
  .doc-head .meta { text-align: right; font-size: 12px; color: #6b7280; }
  .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f3f4f6; color: #374151; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border: 1px solid #e5e7eb; }
  th { width: 34%; background: #f9fafb; font-weight: 600; }
  .fn th { width: auto; background: #f9fafb; }
  p.block { font-size: 13px; white-space: pre-wrap; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin: 0; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <div class="doc-head">
    <div>
      <h1>${escapeHtml(position.name)}</h1>
      <div class="badge">${escapeHtml(status.label)}</div>
    </div>
    <div class="meta">
      <div>Código: ${escapeHtml(profile?.doc.code_format || "—")}</div>
      <div>Versión: ${escapeHtml(profile?.doc.version || "—")}</div>
      <div>Fecha: ${escapeHtml(profile?.doc.elaboration_date || "—")}</div>
    </div>
  </div>

  <h2>Información General</h2>
  <table>
    ${row("Área / Departamento", department?.name ?? "—")}
    ${row("Nivel", levelLabel(position.level))}
    ${row("Reporta a", reportsToName ?? "—")}
    ${row("Supervisa a", profile?.general.supervises ?? "—")}
    ${row("Personas a cargo", String(profile?.general.people_in_charge ?? "—"))}
    ${row("Áreas con las que interactúa", (profile?.general.interacts_with ?? []).join(", "))}
    ${row("Tipo de Jornada", jobTypeLabel(position.job_type))}
    ${row("Horario Laboral", position.work_schedule ?? "—")}
    ${row("Rango Salarial", position.salary_range ?? "—")}
    ${row("Elaborado por", profile?.doc.elaborated_by ?? "—")}
    ${row("Aprobado por", profile?.doc.approved_by ?? "—")}
  </table>

  <h2>Objetivo del Cargo</h2>
  <p class="block">${escapeHtml(profile?.objective || "—")}</p>

  <h2>Funciones y Responsabilidades</h2>
  <table class="fn">
    <tr><th>Responsabilidad</th><th>Periodicidad</th><th>Reportes</th></tr>
    ${functionsRows}
  </table>

  <h2>Requisitos y Conocimientos</h2>
  <table>
    ${row("Formación Académica", profile?.requirements.academic_level ?? "—")}
    ${row("Especialidad / Carreras afines", profile?.requirements.specialty ?? "—")}
    ${row("Experiencia Laboral", profile?.requirements.experience ?? "—")}
    ${row("Otros Conocimientos / Herramientas", profile?.requirements.other_knowledge ?? "—")}
    ${row("Idiomas", profile?.requirements.languages ?? "—")}
  </table>

  <h2>Competencias</h2>
  <table>
    ${row("Generales / Comportamentales", profile?.competencies.general ?? "—")}
    ${row("Técnicas / Específicas", profile?.competencies.technical ?? "—")}
  </table>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
}
