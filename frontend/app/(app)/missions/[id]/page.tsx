import { use } from "react"
import { MissionDetailView } from "@/components/missions/mission-detail"

export default function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <MissionDetailView id={id} />
}
