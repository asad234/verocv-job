import useSWRMutation from 'swr/mutation';
import type {
  CreateProfileRequest,
  UpdateProfileRequest,
  SingleProfileResponse,
} from '@/types/payloadTypes';

// --- Utilities ---
const convertDatesToStrings = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(convertDatesToStrings);
  if (typeof data === 'object') {
    const fieldsToConvert = ['startDate', 'endDate', 'validDate'];
    const newData: Record<string, any> = {};
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const value = data[key];
      if (fieldsToConvert.includes(key) && value instanceof Date) {
        newData[key] = value.toISOString();
      } else if (typeof value === 'object' && value !== null) {
        newData[key] = convertDatesToStrings(value);
      } else {
        newData[key] = value;
      }
    }
    return newData;
  }
  return data;
};

const convertDatesToObjects = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(convertDatesToObjects);
  if (typeof data === 'object') {
    const fieldsToConvert = ['startDate', 'endDate', 'validDate'];
    const newData: Record<string, any> = {};
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const value = data[key];
      if (fieldsToConvert.includes(key) && typeof value === 'string') {
        const parsed = new Date(value);
        newData[key] = isNaN(parsed.getTime()) ? value : parsed;
      } else if (typeof value === 'object' && value !== null) {
        newData[key] = convertDatesToObjects(value);
      } else {
        newData[key] = value;
      }
    }
    return newData;
  }
  return data;
};

const sendJson = async <T>(
  url: string,
  method: 'POST' | 'PATCH',
  body: any
): Promise<T> => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(convertDatesToStrings(body)),
  });

  if (!res.ok) {
    throw await res.json();
  }

  const json = await res.json();
  return convertDatesToObjects(json) as T;
};

// --- Types ---
interface UpdateProfileMutationArg extends Omit<UpdateProfileRequest, 'user'> {
  id: string;
}

export const useProfileMutations = () => {
  // --- Create Profile ---
  const { trigger: createProfileTrigger, isMutating: isCreatingProfile } = useSWRMutation(
    '/api/profile',
    async (key, { arg }: { arg: Omit<CreateProfileRequest, 'user'> }) => {
      return await sendJson<SingleProfileResponse>(key, 'POST', arg);
    }
  );

  const createProfile = async (data: Omit<CreateProfileRequest, 'user'>) => {
    return await createProfileTrigger(data);
  };

  // --- Update Profile ---
  const {
    trigger: updateProfileTrigger,
    isMutating: isUpdatingProfile,
  } = useSWRMutation(
    '/api/profile',
    async (key, { arg }: { arg: UpdateProfileMutationArg }) => {
      const { id, ...payload } = arg;
      const url = `${key}?id=${id}`;
      return await sendJson<SingleProfileResponse>(url, 'PATCH', payload);
    }
  );

  const updateProfile = async (id: string, data: Omit<UpdateProfileRequest, 'user'>) => {
    return await updateProfileTrigger({ id, ...data });
  };

  return {
    createProfile,
    isCreatingProfile,
    updateProfile,
    isUpdatingProfile,
  };
};
