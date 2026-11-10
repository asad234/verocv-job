// types/employment-details.ts
export type EmploymentDetails = {
id?: string;
  user?: string;
  employmentRate?: string;
  canTravel?: string;
  officeLocation?: string;
  employmentDate?: string;
  homeAddress?: string;
  presentTitle?: string;
  workArea?: string;
  preferredLocation?: string;
  secondaryLocation?: string;
  assignmentAbroad?: string;
  salaryLevel?: string;
  salaryCurrency?: string;
  feeRate?: string;
  feeCurrency?: string;
  feeRateType?: string;
};

export type AddressSuggestion = {
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    country?: string;
    [key: string]: any;
  };
  boundingbox: string[];
  class: string;
  type: string;
  importance: number;
};