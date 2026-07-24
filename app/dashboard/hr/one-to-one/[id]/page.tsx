import { OneToOneDetail } from "@/components/hr/one-to-one-detail"

export default async function OneToOneReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OneToOneDetail reportId={id} />
}
