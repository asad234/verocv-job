// utils.ts
import { AddressSuggestion } from "../types/detailtsType";

export const formatAddress = (result: AddressSuggestion): string => {
  const parts = [];

  // Add road and house number if available
  if (result.address.road) {
    let roadPart = result.address.road;
    if (result.address.house_number) {
      roadPart += ` ${result.address.house_number}`;
    }
    parts.push(roadPart);
  }

  // Add postal code and city
  if (result.address.postcode && result.address.city) {
    parts.push(`${result.address.postcode} ${result.address.city}`);
  } else if (result.address.postcode) {
    parts.push(result.address.postcode);
  } else if (result.address.city) {
    parts.push(result.address.city);
  }

  // Add country
  if (result.address.country) {
    parts.push(result.address.country);
  }

  return parts.join(", ");
};

export const fetchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=5&countrycodes=se`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching address suggestions:", error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data && data.address ? formatAddress(data) : null;
  } catch (error) {
    console.error("Error getting address from coordinates:", error);
    return null;
  }
};