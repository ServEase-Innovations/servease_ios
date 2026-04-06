// ProviderDetailsType.ts

export interface MonthlyAvailabilitySummary {
  totalDays: number;
  daysAtPreferredTime: number;
  daysWithDifferentTime: number;
  unavailableDays: number;
}

export interface MonthlyAvailabilityException {
  date: string;
  reason: "ON_DEMAND" | "FULLY_BOOKED";
  suggestedTime: string | null;
}

export interface MonthlyAvailabilityDTO {
  preferredTime: string;
  fullyAvailable: boolean;
  summary: MonthlyAvailabilitySummary;
  exceptions: MonthlyAvailabilityException[];
}

export interface PreviousBookingDetails {
  engagementId: string;
  bookingType: string;
  serviceType: string;
  startDate: string;
  endDate: string;
  engagementStatus: string;
  assignmentStatus: string;
  taskStatus: string;
  active: boolean;
  baseAmount: number;
  createdAt: string;
}

export interface ServiceProviderDTO {
   id?: string | number; 
  serviceproviderid: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  experience: number;
  rating: number;
  dob: string;
  age: number;
  otherServices: string | null;
  housekeepingRole: string;
  housekeepingRoles:string[];
  diet: "VEG" | "NONVEG" | "BOTH";
  cookingspeciality: "VEG" | "NONVEG" | "BOTH";
  languageknown: string | string[] | null;
  locality: string;
  location: string;
  pincode: number;
  latitude: number;
  longitude: number;
  distance_km: number;
  bestMatch: boolean;
  monthlyAvailability: MonthlyAvailabilityDTO;
  previouslyBooked: boolean;
  previousBookingDetails: PreviousBookingDetails | null;
}

export interface NearbyMonthlyResponseDTO {
  count: number;
  providers: ServiceProviderDTO[];
}

export interface EnhancedProviderDetails extends ServiceProviderDTO {
  selectedMorningTime?: number | null;
  selectedEveningTime?: number | null;
  matchedMorningSelection?: string | null;
  matchedEveningSelection?: string | null;
  startTime?: string;
  endTime?: string;
}