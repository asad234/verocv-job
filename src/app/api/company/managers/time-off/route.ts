// FILE LOCATION:  src/app/api/company/managers/time-off/route.ts   (REPLACE — same behaviour, shared code)
// URL:            GET · POST /api/company/managers/time-off — the manager's own days-off requests
import { MANAGER_SELF, myTimeOffHandlers } from '@/utils/server/myAvailabilityHandler'

export const { GET, POST } = myTimeOffHandlers(MANAGER_SELF)
