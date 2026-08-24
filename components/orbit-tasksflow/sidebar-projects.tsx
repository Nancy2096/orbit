"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Briefcase,
  FolderKanban,
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  FolderMinus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SidebarProjectMeta {
  id: string
  name: string
  client: string
}

type ProjectNode = { type: "project"; projectId: string }
type GroupNode = { type: "group"; id: string; name: string; collapsed: boolean; children: string[] }
type LayoutNode = ProjectNode | GroupNode

type DropTarget =
  | { zone: "top"; key: string; pos: "before" | "after" | "onto" }
  | { zone: "child"; groupId: string; childId: string; pos: "before" | "after" }

const LAYOUT_KEY = "orbit-tasksflow-sidebar-layout"

const nodeKey = (n: LayoutNode) => (n.type === "project" ? `p:${n.projectId}` : `g:${n.id}`)

function buildDefault(projects: SidebarProjectMeta[]): LayoutNode[] {
  return projects.map((p) => ({ type: "project", projectId: p.id }))
}

// Concilia el layout guardado con la lista real de proyectos: descarta ids
// inexistentes/duplicados, elimina grupos vacíos y agrega proyectos nuevos.
function reconcile(layout: LayoutNode[], projects: SidebarProjectMeta[]): LayoutNode[] {
  const valid = new Set(projects.map((p) => p.id))
  const seen = new Set<string>()
  const result: LayoutNode[] = []
  for (const n of layout) {
    if (n.type === "project") {
      if (valid.has(n.projectId) && !seen.has(n.projectId)) {
        seen.add(n.projectId)
        result.push({ type: "project", projectId: n.projectId })
      }
    } else {
      const children: string[] = []
      for (const c of n.children) {
        if (valid.has(c) && !seen.has(c)) {
          seen.add(c)
          children.push(c)
        }
      }
      if (children.length > 0) {
        result.push({ type: "group", id: n.id, name: n.name || "Grupo", collapsed: !!n.collapsed, children })
      }
    }
  }
  for (const p of projects) {
    if (!seen.has(p.id)) result.push({ type: "project", projectId: p.id })
  }
  return result
}

// Quita un proyecto de donde esté (nivel superior o dentro de un grupo) y
// elimina grupos que queden vacíos.
function removeProject(layout: LayoutNode[], projectId: string): LayoutNode[] {
  return layout
    .map((n) =>
      n.type === "group" ? { ...n, children: n.children.filter((c) => c !== projectId) } : n
    )
    .filter((n) => (n.type === "project" ? n.projectId !== projectId : n.children.length > 0))
}

interface SidebarProjectsProps {
  projects: SidebarProjectMeta[]
  isCollapsed: boolean
  pathname: string
  isTaskDetail: boolean
  activeProjectId: string | null
}

export function SidebarProjects({
  projects,
  isCollapsed,
  pathname,
  isTaskDetail,
  activeProjectId,
}: SidebarProjectsProps) {
  const [mounted, setMounted] = useState(false)
  const [layout, setLayout] = useState<LayoutNode[]>(() => buildDefault(projects))
  const [dragProjectId, setDragProjectId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupNameDraft, setGroupNameDraft] = useState("")
  const renameRef = useRef<HTMLInputElement | null>(null)

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  // Cargar layout guardado y conciliar con los proyectos actuales.
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(LAYOUT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as LayoutNode[]
        setLayout(reconcile(parsed, projects))
      } else {
        setLayout(buildDefault(projects))
      }
    } catch {
      setLayout(buildDefault(projects))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistir cambios.
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    } catch {
      /* noop */
    }
  }, [layout, mounted])

  // Enfocar el input al entrar en modo renombrar grupo.
  useEffect(() => {
    if (editingGroupId && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [editingGroupId])

  const resetDrag = () => {
    setDragProjectId(null)
    setDropTarget(null)
  }

  const isProjectActive = (id: string) => {
    const href = `/orbit-tasksflow/projects/${id}`
    return (
      pathname === href ||
      pathname.startsWith(href + "/") ||
      (isTaskDetail && activeProjectId === id)
    )
  }

  // Calcula la posición de soltado según la posición del cursor dentro de la fila.
  const computeTopPos = (e: React.DragEvent, allowOnto: boolean): "before" | "after" | "onto" => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = rect.height
    if (!allowOnto) return y < h / 2 ? "before" : "after"
    if (y < h * 0.28) return "before"
    if (y > h * 0.72) return "after"
    return "onto"
  }

  const commitDrop = () => {
    if (!dragProjectId || !dropTarget) return resetDrag()

    // Evita agrupar un proyecto sobre sí mismo.
    if (dropTarget.zone === "top" && dropTarget.key === `p:${dragProjectId}` && dropTarget.pos === "onto") {
      return resetDrag()
    }

    let l = removeProject(layout, dragProjectId)

    if (dropTarget.zone === "top") {
      const idx = l.findIndex((n) => nodeKey(n) === dropTarget.key)
      if (idx === -1) {
        l = [...l, { type: "project", projectId: dragProjectId }]
      } else if (dropTarget.pos === "onto") {
        const target = l[idx]
        if (target.type === "group") {
          l = l.map((n, i) =>
            i === idx && n.type === "group" ? { ...n, children: [...n.children, dragProjectId] } : n
          )
        } else if (target.projectId !== dragProjectId) {
          const gid = `grp-${Date.now()}`
          const newGroup: GroupNode = {
            type: "group",
            id: gid,
            name: "Nuevo grupo",
            collapsed: false,
            children: [target.projectId, dragProjectId],
          }
          l = l.map((n, i) => (i === idx ? newGroup : n))
          setLayout(l)
          resetDrag()
          setGroupNameDraft("Nuevo grupo")
          setEditingGroupId(gid)
          return
        }
      } else {
        const insertAt = dropTarget.pos === "before" ? idx : idx + 1
        l = [...l.slice(0, insertAt), { type: "project", projectId: dragProjectId }, ...l.slice(insertAt)]
      }
    } else {
      const gIdx = l.findIndex((n) => n.type === "group" && n.id === dropTarget.groupId)
      if (gIdx === -1) {
        l = [...l, { type: "project", projectId: dragProjectId }]
      } else {
        const g = l[gIdx] as GroupNode
        const cIdx = g.children.indexOf(dropTarget.childId)
        const insertAt = cIdx === -1 ? g.children.length : dropTarget.pos === "before" ? cIdx : cIdx + 1
        const children = [...g.children.slice(0, insertAt), dragProjectId, ...g.children.slice(insertAt)]
        l = l.map((n, i) => (i === gIdx ? { ...g, children } : n))
      }
    }

    setLayout(l)
    resetDrag()
  }

  const toggleGroupCollapsed = (groupId: string) => {
    setLayout((prev) =>
      prev.map((n) => (n.type === "group" && n.id === groupId ? { ...n, collapsed: !n.collapsed } : n))
    )
  }

  const saveGroupName = () => {
    if (!editingGroupId) return
    const name = groupNameDraft.trim() || "Grupo"
    setLayout((prev) =>
      prev.map((n) => (n.type === "group" && n.id === editingGroupId ? { ...n, name } : n))
    )
    setEditingGroupId(null)
    setGroupNameDraft("")
  }

  const ungroup = (groupId: string) => {
    setLayout((prev) => {
      const result: LayoutNode[] = []
      for (const n of prev) {
        if (n.type === "group" && n.id === groupId) {
          for (const c of n.children) result.push({ type: "project", projectId: c })
        } else {
          result.push(n)
        }
      }
      return result
    })
  }

  // Vista colapsada: solo íconos, sin reordenamiento ni agrupación.
  if (isCollapsed) {
    return (
      <>
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/orbit-tasksflow/projects/${project.id}`}
            className={cn(
              "flex items-center justify-center rounded-lg px-2 py-2 text-sm transition-colors",
              isProjectActive(project.id)
                ? "bg-white text-purple-700 font-medium shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            title={`${project.name} · ${project.client}`}
          >
            <Briefcase className="h-4 w-4 flex-shrink-0" />
          </Link>
        ))}
      </>
    )
  }

  const renderProjectLink = (project: SidebarProjectMeta, insideGroup: boolean) => (
    <Link
      href={`/orbit-tasksflow/projects/${project.id}`}
      draggable={false}
      className={cn(
        "flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors min-w-0",
        isProjectActive(project.id)
          ? "bg-white text-purple-700 font-medium shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <Briefcase className="h-4 w-4 flex-shrink-0" />
      <span className="flex flex-col min-w-0">
        <span className="truncate leading-tight">{project.name}</span>
        {!insideGroup && (
          <span className="truncate text-[11px] opacity-70 leading-tight">{project.client}</span>
        )}
      </span>
    </Link>
  )

  return (
    <div className="space-y-0.5">
      {layout.map((node) => {
        if (node.type === "project") {
          const project = projectMap.get(node.projectId)
          if (!project) return null
          const key = `p:${node.projectId}`
          const isDropOnto = dropTarget?.zone === "top" && dropTarget.key === key && dropTarget.pos === "onto"
          const isDropBefore =
            dropTarget?.zone === "top" && dropTarget.key === key && dropTarget.pos === "before"
          const isDropAfter =
            dropTarget?.zone === "top" && dropTarget.key === key && dropTarget.pos === "after"
          return (
            <div
              key={key}
              draggable
              onDragStart={() => setDragProjectId(node.projectId)}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget({ zone: "top", key, pos: computeTopPos(e, dragProjectId !== node.projectId) })
              }}
              onDrop={(e) => {
                e.preventDefault()
                commitDrop()
              }}
              onDragEnd={resetDrag}
              className={cn(
                "group/row flex items-center rounded-lg transition-colors",
                dragProjectId === node.projectId && "opacity-40",
                isDropOnto && "ring-2 ring-inset ring-white/70 bg-white/10",
                isDropBefore && "border-t-2 border-t-white",
                isDropAfter && "border-b-2 border-b-white"
              )}
            >
              <span
                className="flex h-8 w-5 flex-shrink-0 cursor-grab items-center justify-center text-white/30 opacity-0 transition-opacity group-hover/row:opacity-100 active:cursor-grabbing"
                aria-hidden="true"
              >
                <GripVertical className="h-4 w-4" />
              </span>
              {renderProjectLink(project, false)}
            </div>
          )
        }

        // Grupo
        const key = `g:${node.id}`
        const isDropBefore =
          dropTarget?.zone === "top" && dropTarget.key === key && dropTarget.pos === "before"
        const isDropAfter =
          dropTarget?.zone === "top" && dropTarget.key === key && dropTarget.pos === "after"
        const isDropOnto = dropTarget?.zone === "top" && dropTarget.key === key && dropTarget.pos === "onto"
        return (
          <div key={key} className="space-y-0.5">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget({ zone: "top", key, pos: computeTopPos(e, true) })
              }}
              onDrop={(e) => {
                e.preventDefault()
                commitDrop()
              }}
              className={cn(
                "flex items-center gap-1 rounded-lg px-1 py-1 text-white/80 transition-colors",
                isDropOnto && "ring-2 ring-inset ring-white/70 bg-white/10",
                isDropBefore && "border-t-2 border-t-white",
                isDropAfter && "border-b-2 border-b-white"
              )}
            >
              <button
                type="button"
                onClick={() => toggleGroupCollapsed(node.id)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
                aria-label={node.collapsed ? "Expandir grupo" : "Colapsar grupo"}
              >
                {node.collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              <FolderKanban className="h-4 w-4 flex-shrink-0 text-white/70" />
              {editingGroupId === node.id ? (
                <Input
                  ref={renameRef}
                  value={groupNameDraft}
                  onChange={(e) => setGroupNameDraft(e.target.value)}
                  onBlur={saveGroupName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault()
                      saveGroupName()
                    } else if (e.key === "Escape") {
                      setEditingGroupId(null)
                      setGroupNameDraft("")
                    }
                  }}
                  className="h-7 flex-1 bg-white/15 border-white/20 text-white text-sm placeholder:text-white/50"
                />
              ) : (
                <button
                  type="button"
                  onDoubleClick={() => {
                    setGroupNameDraft(node.name)
                    setEditingGroupId(node.id)
                  }}
                  onClick={() => toggleGroupCollapsed(node.id)}
                  className="flex-1 truncate text-left text-sm font-semibold uppercase tracking-wide text-white/80"
                  title={node.name}
                >
                  {node.name}
                </button>
              )}
              <span className="text-[11px] text-white/40">{node.children.length}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Acciones del grupo"
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-white/60 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={() => {
                      setGroupNameDraft(node.name)
                      setEditingGroupId(node.id)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Renombrar grupo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => ungroup(node.id)}>
                    <FolderMinus className="h-4 w-4 mr-2" />
                    Desagrupar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {!node.collapsed && (
              <div className="ml-3 space-y-0.5 border-l border-white/10 pl-1">
                {node.children.map((childId) => {
                  const project = projectMap.get(childId)
                  if (!project) return null
                  const childDropBefore =
                    dropTarget?.zone === "child" &&
                    dropTarget.groupId === node.id &&
                    dropTarget.childId === childId &&
                    dropTarget.pos === "before"
                  const childDropAfter =
                    dropTarget?.zone === "child" &&
                    dropTarget.groupId === node.id &&
                    dropTarget.childId === childId &&
                    dropTarget.pos === "after"
                  return (
                    <div
                      key={childId}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation()
                        setDragProjectId(childId)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDropTarget({
                          zone: "child",
                          groupId: node.id,
                          childId,
                          pos: computeTopPos(e, false) as "before" | "after",
                        })
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        commitDrop()
                      }}
                      onDragEnd={resetDrag}
                      className={cn(
                        "group/row flex items-center rounded-lg transition-colors",
                        dragProjectId === childId && "opacity-40",
                        childDropBefore && "border-t-2 border-t-white",
                        childDropAfter && "border-b-2 border-b-white"
                      )}
                    >
                      <span
                        className="flex h-8 w-5 flex-shrink-0 cursor-grab items-center justify-center text-white/30 opacity-0 transition-opacity group-hover/row:opacity-100 active:cursor-grabbing"
                        aria-hidden="true"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      {renderProjectLink(project, true)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
