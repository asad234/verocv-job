// FILE LOCATION:  src/app/api/company/managers/availability/route.ts   (REPLACE — same behaviour, shared code)
// URL:            GET · PUT /api/company/managers/availability — the manager's own week + status
import { MANAGER_SELF, myAvailabilityHandlers } from '@/utils/server/myAvailabilityHandler'

export const { GET, PUT } = myAvailabilityHandlers(MANAGER_SELF)
