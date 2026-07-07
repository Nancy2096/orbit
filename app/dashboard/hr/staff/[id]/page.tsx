"use client"

import { use } from "react"
import { StaffEditForm } from "@/components/hr/staff-edit-form"

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <StaffEditForm staffId={id} />
}
