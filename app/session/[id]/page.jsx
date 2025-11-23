import { InterviewSession } from "@/components/pages/interview-session"

export default function SessionPage({ params }) {
  return <InterviewSession sessionId={params.id} />
}
