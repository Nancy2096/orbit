import type { Metadata } from "next"
import { CollectionsView } from "@/components/collections/collections-view"

export const metadata: Metadata = {
  title: "Gestión de Cobranza | Orbit",
}

export default function CollectionsPage() {
  return <CollectionsView />
}
