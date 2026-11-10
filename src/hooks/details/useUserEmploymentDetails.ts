// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/hooks/details/useUserEmploymentDetails.ts  (replace your current file)
// WHAT IT DOES:   Same hook, same return values ({ employmentDetails, isLoading,
//                 error, mutate }) — but it reads /api/user/employment-details
//                 instead of Payload's /api/employment-details (now locked down
//                 because it holds salary data → that was the 403).
//
//                 All three employment hooks use the same SWR key, so they share
//                 one cache: saving anywhere updates everything showing it.
// ══════════════════════════════════════════════════════════════════════

'use client'

import useSWR from 'swr'
import type { EmploymentDetails } from '@/types/detailtsType'

export const EMPLOYMENT_DETAILS_KEY = '/api/user/employment-details'

/** Turns the route's response into the record shape the rest of the app uses. */
export function toEmploymentRecord(
  body: any,
  userId?: string | number | null,
): EmploymentDetails | null {
  if (!body?.data || !body?.id) return null
  return {
    ...body.data,
    id: String(body.id),
    updatedAt: body.updatedAt ?? null,
    ...(userId != null ? { user: String(userId) } : {}),
  } as unknown as EmploymentDetails
}

export async function fetchEmploymentDetails(url: string = EMPLOYMENT_DETAILS_KEY) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (res.status === 401) return null // not logged in (yet)
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  return res.json()
}

export const useUserEmploymentDetails = (userId: string | undefined, options?: any) => {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? EMPLOYMENT_DETAILS_KEY : null,
    async (url: string) => toEmploymentRecord(await fetchEmploymentDetails(url), userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...options,
    },
  )

  return {
    employmentDetails: data,
    isLoading,
    error,
    mutate,
  }
}
