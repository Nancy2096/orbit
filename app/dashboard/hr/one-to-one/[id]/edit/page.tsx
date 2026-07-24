import { OneToOneForm } from "@/components/hr/one-to-one-form"

export default async function EditOneToOneReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OneToOneForm reportId={id} />
}
