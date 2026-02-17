import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Your existing interfaces remain the same
interface BaseCartItem {
  id: string;
  price: number;
  description: string;
  quantity?: number;
}

export interface MealCartItem extends BaseCartItem {
  type: 'meal';
  mealType: string;
  persons: number;
  basePrice: number;
  maxPersons: number;
}

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

export interface NannyCartItem extends BaseCartItem {
  type: 'nanny';
  careType: 'baby' | 'elderly';
  packageType: 'day' | 'night' | 'fullTime';
  age: number;
  providerId?: string;
  providerName?: string;
  activeTab: "baby" | "elderly";
}

export type CartItem = MealCartItem | MaidCartItem | NannyCartItem;

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

// Initial state
const initialState: CartState = {
  items: [],
};

// Create the slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.items.push(action.payload);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateCartItem: (state, action: PayloadAction<CartItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
  },
});

// Export actions
export const { addToCart, removeFromCart, updateCartItem, clearCart, updateQuantity } = cartSlice.actions;

// Export reducer as default
export default cartSlice.reducer;