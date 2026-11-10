// FILE LOCATION:  src/app/api/user/time-off/route.ts   (NEW)
// URL:            GET · POST /api/user/time-off — the employee's days-off requests
//                 (goes to their managers; sick / VAB are registered straight away)
import { EMPLOYEE_SELF, myTimeOffHandlers } from '@/utils/server/myAvailabilityHandler'

export const { GET, POST } = myTimeOffHandlers(EMPLOYEE_SELF)
