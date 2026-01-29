// // types.ts

// types.ts
export interface ProviderDetailsType {
    serviceproviderId: string;
    firstname: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dob: string;
    diet: string;
    language?: string;
    experience?: string;
    otherServices?: string;
    housekeepingRole: string;
    availableTimeSlots?: string[];
  }
  
  export interface EnhancedProviderDetails extends ProviderDetailsType {
    selectedMorningTime?: number | null;
    selectedEveningTime?: number | null;
    matchedMorningSelection?: string | null;
    matchedEveningSelection?: string | null;
    startTime?: string;
    endTime?: string;
  }
  
  export interface DialogProps {
    open: boolean;
    handleClose: () => void;
    providerDetails: EnhancedProviderDetails;
  }

  /** Monthly availability summary */
export interface MonthlyAvailabilitySummary {
  totalDays: number;
  daysAtPreferredTime: number;
  daysWithDifferentTime: number;
  unavailableDays: number;
}

/** Monthly availability exception */
export interface MonthlyAvailabilityException {
  date: string;               // YYYY-MM-DD
  reason: "ON_DEMAND" | "FULLY_BOOKED";
  suggestedTime: string | null; // HH:mm or null
}

/** Monthly availability DTO */
export interface MonthlyAvailabilityDTO {
  preferredTime: string; // HH:mm
  fullyAvailable: boolean;
  summary: MonthlyAvailabilitySummary;
  exceptions: MonthlyAvailabilityException[];
}

/** Service Provider DTO (Frontend) */
export interface ServiceProviderDTO {
  serviceproviderid: string;

  // Basic info
  firstname: string;
  lastname: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  experience: number; // years
  rating: number;
  dob: string; // ISO date string
  age: number;
  otherServices: string | null;

  housekeepingRole: string;

  // Preferences
  diet: "VEG" | "NON_VEG" | "BOTH";
  cookingspeciality: "VEG" | "NON_VEG" | "BOTH";
  languageknown: string[] | null;
  
  // Location
  locality: string;
  location: string;
  pincode: number;
  latitude: number;
  longitude: number;
  distance_km: number;

  // Ranking flags
  bestMatch: boolean;

  // Availability
  monthlyAvailability: MonthlyAvailabilityDTO;
}


export interface NearbyMonthlyResponseDTO {
  count: number;
  providers: ServiceProviderDTO[];
}





// export interface ProviderDetailsType {
//     serviceproviderId: string;
//     firstName: string;
//     middleName?: string;
//     lastName: string;
//     gender: string;
//     dob: string;
//     diet: string;
//     language?: string;
//     experience?: string;
//     otherServices?: string;
//     housekeepingRole: string;
//     availableTimeSlots?: string[];
//   }

//     /** Monthly availability summary */
// export interface MonthlyAvailabilitySummary {
//   totalDays: number;
//   daysAtPreferredTime: number;
//   daysWithDifferentTime: number;
//   unavailableDays: number;
// }

//   /** Monthly availability exception */
// export interface MonthlyAvailabilityException {
//   date: string;               // YYYY-MM-DD
//   reason: "ON_DEMAND" | "FULLY_BOOKED";
//   suggestedTime: string | null; // HH:mm or null
// }

// /** Monthly availability DTO */
// export interface MonthlyAvailabilityDTO {
//   preferredTime: string; // HH:mm
//   fullyAvailable: boolean;
//   summary: MonthlyAvailabilitySummary;
//   exceptions: MonthlyAvailabilityException[];
// }
  
//   // export interface EnhancedProviderDetails extends ProviderDetailsType {
//   //   selectedMorningTime?: number | null;
//   //   selectedEveningTime?: number | null;
//   //   matchedMorningSelection?: string | null;
//   //   matchedEveningSelection?: string | null;
//   //   startTime?: string;
//   //   endTime?: string;
//   // }
  
//   // types/ProviderDetailsType.ts
// export interface EnhancedProviderDetails {
//   // Support both naming conventions
//   serviceproviderid?: string;
//   serviceproviderId?: string;
  
//   firstname?: string;
//   firstName?: string;
  
//   lastname?: string;
//   lastName?: string;
  
//   housekeepingrole?: string;
//   housekeepingRole?: string;
  
//   // Other properties
//   selectedMorningTime: number | null;
//   selectedEveningTime: number | null;
//   matchedMorningSelection: string | null;
//   matchedEveningSelection: string | null;
//   startTime: string;
//   endTime: string;
  
//   // Add any other properties from both React and React Native
//   gender?: string;
//   dob?: string;
//   diet?: string;
//   languageknown?: string[];
//   experience?: number;
//   otherServices?: string;
//   availableTimeSlots?: string[];
//   rating?: number;
//   distance_km?: number;
//   bestMatch?: boolean;
//   monthlyAvailability?: {
//     fullyAvailable: boolean;
//     preferredTime?: string;
//   };
//   age?: number;
//   locality?: string;
// }
//   export interface DialogProps {
//     open: boolean;
//     handleClose: () => void;
//     providerDetails: EnhancedProviderDetails;
//   }