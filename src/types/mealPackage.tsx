// types/mealPackage.types.ts (or any appropriate location)
export interface MealPackage {
  selected: boolean;
  persons: number;
  basePrice: number;
  calculatedPrice: number;
  maxPersons: number;
  description: string[];
  preparationTime: string;
  rating: number;
  reviews: string;
  category: string;
  jobDescription: string;
  remarks: string;
  inCart: boolean;
}