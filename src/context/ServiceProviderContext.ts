import React, { createContext, useState } from "react";

// Define the type for the context
interface ServiceProviderContextType {
  selectedBookingType: string | undefined;
  setSelectedBookingType: (data: string) => void;
}

// Create the context with a default value
export const ServiceProviderContext = createContext<ServiceProviderContextType>({
  selectedBookingType: undefined,
  setSelectedBookingType: () => {},
});