import useSWR from 'swr'

export const useUserPersonalInformation = (userId: string | null, options?: any) => {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/personal-info?where[user][equals]=${userId}&limit=1` : null,
    async (url: string) => {
      try {
        const response = await fetch(url)

        // Handle 404 as expected for new users (no personal info yet)
        if (response.status === 404) {
          return null
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        const json = await response.json()
        // Since we're using limit=1, return the first item if it's an array
        return Array.isArray(json.docs) ? json.docs[0] : json
      } catch (err) {
        console.error('Error fetching personal information:', err)
        // Don't throw for 404s, just return null
        if (err instanceof Error && err.message.includes('404')) {
          return null
        }
        throw err
      }
    },
    {
      revalidateOnFocus: false, // Reduce unnecessary requests
      revalidateOnReconnect: false,
      ...options,
    },
  )

  return {
    personalInformation: data,
    isLoading,
    error,
    mutate,
  }
}
