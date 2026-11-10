import EmployeeInterviews from "@/components/Dashboard/Employeeinterviews"
import { Suspense } from "react"

// useSearchParams() (used for ?interview=<id>) requires a Suspense boundary.
export default function InterviewsPage() {
  return (
    <Suspense fallback={null}>
      <EmployeeInterviews />
    </Suspense>
  )
}
