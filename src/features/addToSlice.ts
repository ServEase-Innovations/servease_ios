import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState, isMaidCartItem, isNannyCartItem, isMealCartItem } from '../types/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to load cart from AsyncStorage
const loadCartFromStorage = async (): Promise<CartItem[]> => {
  try {
    const savedCart = await AsyncStorage.getItem('unifiedCart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error parsing cart from AsyncStorage', error);
    return [];
  }
};

// Initialize state asynchronously
const initializeState = async (): Promise<CartState> => {
  const items = await loadCartFromStorage();
  return { items };
};

// Create initial state (will be populated asynchronously)
const initialState: CartState = {
  items: [],
};

export const addToSlice = createSlice({
  name: 'addToCart',
  initialState,
  reducers: {
    // Add or update item in cart
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const { type, id } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) => item.id === id && item.type === type
      );

      if (existingIndex >= 0) {
        // Update existing item
        const existingItem = state.items[existingIndex];
        
        if (isMealCartItem(action.payload) && isMealCartItem(existingItem)) {
          state.items[existingIndex] = { ...existingItem, ...action.payload };
        } 
        else if (isMaidCartItem(action.payload) && isMaidCartItem(existingItem)) {
          state.items[existingIndex] = { ...existingItem, ...action.payload };
        }
        else if (isNannyCartItem(action.payload) && isNannyCartItem(existingItem)) {
          state.items[existingIndex] = { ...existingItem, ...action.payload };
        }
      } else {
        // Add new item
        state.items.push(action.payload);
      }

      // Save to AsyncStorage
      AsyncStorage.setItem('unifiedCart', JSON.stringify(state.items)).catch(error => {
        console.error('Error saving cart to AsyncStorage', error);
      });
    },

    // Remove item from cart - Enhanced version from React code
    removeFromCart: (state, action: PayloadAction<{ id?: string; type: CartItem['type'] }>) => {
      if (action.payload.id) {
        // Remove specific item
        state.items = state.items.filter(
          (item) => !(item.id === action.payload.id && item.type === action.payload.type)
        );
      } else {
        // Remove all items of this type
        state.items = state.items.filter((item) => item.type !== action.payload.type);
      }
      
      // Save to AsyncStorage
      AsyncStorage.setItem('unifiedCart', JSON.stringify(state.items)).catch(error => {
        console.error('Error saving cart to AsyncStorage', error);
      });
    },

    // Update specific fields of an item
    updateCartItem: (
      state,
      action: PayloadAction<{
        id: string;
        type: CartItem['type'];
        updates: Partial<CartItem>;
      }>
    ) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id && item.type === action.payload.type
      );

      if (index >= 0) {
        // Use Object.assign to properly handle Immer drafts
        Object.assign(state.items[index], action.payload.updates);
        // Save to AsyncStorage
        AsyncStorage.setItem('unifiedCart', JSON.stringify(state.items)).catch(error => {
          console.error('Error saving cart to AsyncStorage', error);
        });
      }
    },

    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      AsyncStorage.removeItem('unifiedCart').catch(error => {
        console.error('Error removing cart from AsyncStorage', error);
      });
    },

    // Special reducer to hydrate state from AsyncStorage
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
  },
});

// Async action to load cart from storage
export const loadCart = () => async (dispatch: any) => {
  try {
    const cartItems = await loadCartFromStorage();
    dispatch(addToSlice.actions.hydrateCart(cartItems));
  } catch (error) {
    console.error('Error loading cart from storage', error);
  }
};

export const { addToCart, removeFromCart, updateCartItem, clearCart } = addToSlice.actions;

// Selectors
export const selectCartItems = (state: { addToCart: CartState }) => state.addToCart.items;

export const selectCartTotal = (state: { addToCart: CartState }) =>
  state.addToCart.items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

export const selectCartItemCount = (state: { addToCart: CartState }) => state.addToCart.items.length;

export const selectCartItemsByType = (type: CartItem['type']) => 
  (state: { addToCart: CartState }) => state.addToCart.items.filter(item => item.type === type);

export default addToSlice.reducer;