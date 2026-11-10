// FILE LOCATION:  src/app/api/user/time-off/[id]/route.ts   (NEW)
// URL:            PATCH /api/user/time-off/:id  { action: "cancel" } — withdraw / "I'm back"
import { EMPLOYEE_SELF, myTimeOffItemHandler } from '@/utils/server/myAvailabilityHandler'

export const { PATCH } = myTimeOffItemHandler(EMPLOYEE_SELF)
