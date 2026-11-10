// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/hooks/details/useEmploymentDetailsMutations.ts  (replace your current file)
// WHAT IT DOES:   Same hook, same names ({ createEmploymentDetails, isCreating,
//                 updateEmploymentDetails, isUpdating }). Both save through
//                 PUT /api/user/employment-details (creates or updates).
//                 Resolves with { doc } like Payload did, so `response.doc` works.
//                 On a validation error it throws the server body
//                 ({ message, errors: { field: code } }).
//                 The user is taken from the login on the server — a user id
//                 sent from the browser is ignored.
// ══════════════════════════════════════════════════════════════════════

'use client'

import useSWRMutation from 'swr/mutation'
import type { EmploymentDetails } from '@/types/detailtsType'
import { EMPLOYMENT_DETAILS_KEY, toEmploymentRecord } from './useUserEmploymentDetails'

type MutationArg = { arg: EmploymentDetails }

async function save(key: string, { arg }: MutationArg) {
  const { id: _id, user, createdAt: _c, updatedAt: _u, ...fields } = (arg ?? {}) as any
  const res = await fetch(key, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Employment details save error:', body)
    throw body
  }
  const doc = toEmploymentRecord(body, user)
  return { doc, updated: doc }
}

// Put the saved record straight into the shared cache (no extra refetch).
const options = {
  populateCache: (result: { doc: EmploymentDetails | null }) => result.doc,
  revalidate: false,
}

export const useEmploymentDetailsMutations = () => {
  const { trigger: createTrigger, isMutating: isCreating } = useSWRMutation(
    EMPLOYMENT_DETAILS_KEY,
    save,
    options,
  )
  const { trigger: updateTrigger, isMutating: isUpdating } = useSWRMutation(
    EMPLOYMENT_DETAILS_KEY,
    save,
    options,
  )

  const createEmploymentDetails = async (data: EmploymentDetails) => await createTrigger(data)
  const updateEmploymentDetails = async (data: EmploymentDetails) => await updateTrigger(data)

  return {
    createEmploymentDetails,
    isCreating,
    updateEmploymentDetails,
    isUpdating,
  }
}
