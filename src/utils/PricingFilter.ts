// hooks/usePricingFilterService.ts
import { useSelector } from "react-redux";

export const usePricingFilterService = () => {
  const bookingType: any | undefined = useSelector((state: any) => state.bookingType?.value);
  const pricing: Record<string, any[]> | undefined = useSelector((state: any) => state.pricing?.groupedServices);

  const getBookingType = () => bookingType;
  const getPricingData = () => pricing;

  const getFilteredPricing = (serviceType: string) => {
    if (!pricing || !serviceType || !pricing[serviceType]) return [];

    const matchBookingType =
      bookingType?.bookingPreference?.toLowerCase() === "date"
        ? "On Demand"
        : "Regular";

    console.log("bookingType?.bookingPreference ", bookingType?.bookingPreference);
    console.log("matchBookingType ", matchBookingType);

    return pricing[serviceType].filter(
      (item: any) => item.BookingType === matchBookingType
    );
  };

  return {
    getBookingType,
    getPricingData,
    getFilteredPricing,
  };
};