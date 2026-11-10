import type {
  ClientCreateProfileRequest,
  ClientUpdateProfileRequest,
  ProfilesResponse,
  SingleProfileResponse,
} from '@/types/payloadTypes'

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    // If the error contains an existingProfileId, include it in the thrown error
    if (error.existingProfileId) {
      const customError: any = new Error(error.message || 'An error occurred while fetching data')
      customError.existingProfileId = error.existingProfileId
      throw customError
    }

    throw new Error(error.message || 'An error occurred while fetching data')
  }
  return response.json() as Promise<T>
}

// Profiles API
export const profilesApi = {
  // Get all profiles
  getProfiles: async (page = 1, limit = 10): Promise<ProfilesResponse> => {
    const response = await fetch(`${API_URL}/api/profile?page=${page}&limit=${limit}`, {
      credentials: 'include',
    })
    return handleResponse<ProfilesResponse>(response)
  },

  // Get a single profile by ID
  getProfile: async (id: string): Promise<SingleProfileResponse> => {
    const response = await fetch(`${API_URL}/api/profile?where[user][equals]=${id}&limit=1`, {
      credentials: 'include',
    })
    return handleResponse<SingleProfileResponse>(response)
  },

  // Get profiles by user ID
  getProfilesByUser: async (userId: string): Promise<ProfilesResponse> => {
    const response = await fetch(`${API_URL}/api/profile?where[user][equals]=${userId}`, {
      credentials: 'include',
    })
    return handleResponse<ProfilesResponse>(response)
  },

  // Get a user's profile (returns the first profile found for a user)
  getUserProfile: async (userId: string): Promise<SingleProfileResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/api/profile?where[user][equals]=${userId}&limit=1`, {
        credentials: 'include',
      })

      const data = await handleResponse<ProfilesResponse>(response)
      return data.docs[0] || null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  },

  // Create a new profile
  createProfile: async (data: ClientCreateProfileRequest): Promise<SingleProfileResponse> => {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    return handleResponse<SingleProfileResponse>(response)
  },

  // Update an existing profile
  updateProfile: async (
    id: string,
    data: ClientUpdateProfileRequest,
  ): Promise<SingleProfileResponse> => {
    const response = await fetch(`${API_URL}/api/profile?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    return handleResponse<SingleProfileResponse>(response)
  },

  // Delete a profile
  deleteProfile: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/profile/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    return handleResponse<void>(response)
  },
}
