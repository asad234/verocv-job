// FILE LOCATION:  src/app/api/user/availability/route.ts   (NEW)
// URL:            GET · PUT /api/user/availability — the employee's own working week + status
//                 (GET also returns the next 14 days, including what they marked in the calendar)
import { EMPLOYEE_SELF, myAvailabilityHandlers } from '@/utils/server/myAvailabilityHandler'

export const { GET, PUT } = myAvailabilityHandlers(EMPLOYEE_SELF)
