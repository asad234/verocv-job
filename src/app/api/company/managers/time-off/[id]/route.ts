// FILE LOCATION:  src/app/api/company/managers/time-off/[id]/route.ts   (REPLACE — same behaviour, shared code)
// URL:            PATCH /api/company/managers/time-off/:id  { action: "cancel" }
import { MANAGER_SELF, myTimeOffItemHandler } from '@/utils/server/myAvailabilityHandler'

export const { PATCH } = myTimeOffItemHandler(MANAGER_SELF)
