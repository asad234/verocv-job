import useSWRMutation from 'swr/mutation'
import type { PersonalInformation } from '@/types/payloadTypes'

type MutationArg = { arg: PersonalInformation }

export const usePersonalInformationMutations = () => {
  const { trigger: createTrigger, isMutating: isCreating } = useSWRMutation(
    '/api/personal-info',
    async (key: string, mutationArg: MutationArg) => {
      const { arg } = mutationArg
      const res = await fetch(key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      if (!res.ok) throw await res.json()
      return await res.json()
    },
  )

  const createPersonalInformation = async (data: PersonalInformation) => {
    return await createTrigger(data)
  }

  const { trigger: updateTrigger, isMutating: isUpdating } = useSWRMutation(
    '/api/personal-info',
    async (key: string, mutationArg: MutationArg) => {
      const { arg } = mutationArg
      const { id, ...rest } = arg
      console.log('got', rest)
      const res = await fetch(`/api/personal-info?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      })
      if (!res.ok) throw await res.json()
      return await res.json()
    },
  )

  const updatePersonalInformation = async (data: PersonalInformation) => {
    return await updateTrigger(data)
  }

  return {
    createPersonalInformation,
    isCreating,
    updatePersonalInformation,
    isUpdating,
  }
}
