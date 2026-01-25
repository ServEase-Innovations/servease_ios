export type Bookingtype = {
    startDate?: any;
    endDate?: any;
    bookingPreference?: string;
    morningSelection?: any;
    eveningSelection?: any;
    timeRange?: any;
    duration?: any;
    startTime?: string;  // Added from BookingForm
    endTime?: string;    // Added from BookingForm
    serviceType?: 'Regular' | 'Premium';  // Added from BookingForm
}