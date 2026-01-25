// Base properties shared by all cart items
interface BaseCartItem {
  id: string;
  price: number;
  description: string;
  quantity?: number;
}

// Meal Cart Item
export interface MealCartItem extends BaseCartItem {
  type: 'meal';
  mealType: string;
  persons: number;
  basePrice: number;
  maxPersons: number;
}

// Maid Service Cart Item
export interface MaidCartItem extends BaseCartItem {
  type: 'maid';
  serviceType: 'package' | 'addon';
  name: string;
  details?: {
    persons?: number;
    houseSize?: string;
    bathrooms?: number;
  };
}

// Nanny Service Cart Item
export interface NannyCartItem extends BaseCartItem {
  type: 'nanny';
  careType: 'baby' | 'elderly';
  packageType: 'day' | 'night' | 'fullTime';
  age: number;
  providerId?: string;  // Added from React code
  providerName?: string; // Added from React code
  activeTab: "baby" | "elderly";
}

// Combined Cart Item type
export type CartItem = MealCartItem | MaidCartItem | NannyCartItem;

// Cart State
export interface CartState {
  items: CartItem[];
}

// Type guard helpers
export function isMealCartItem(item: CartItem): item is MealCartItem {
  return item.type === 'meal';
}

export function isMaidCartItem(item: CartItem): item is MaidCartItem {
  return item.type === 'maid';
}

export function isNannyCartItem(item: CartItem): item is NannyCartItem {
  return item.type === 'nanny';
}