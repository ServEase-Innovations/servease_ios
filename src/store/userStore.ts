import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../features/userSlice';
import cartReducer from '../features/cartSlice';
import bookingTypeReducer from '../features/bookingTypeSlice';
import pricingReducer from '../features/pricingSlice';
import detailsDataReducer from '../features/detailsDataSlice';
import addToCartReducer from '../features/addToSlice';
import geoLocationReducer from '../features/geoLocationSlice';
import customerReducer from '../features/customerSlice'; // Added missing import

// Configure your Redux store
const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    bookingType: bookingTypeReducer,
    pricing: pricingReducer,
    detailsData: detailsDataReducer,
    addToCart: addToCartReducer,
    geoLocation: geoLocationReducer,
    customer: customerReducer, // Added customer reducer
  },
});

// Define RootState type by inferring it directly from the store
export type RootState = ReturnType<typeof store.getState>;

// Export the store for use in the application
export default store;