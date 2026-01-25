export type BookingDetails = {
    id?: number;
    serviceProviderId?: number | null;
    serviceProviderName?: string,
    customerId?: number;
    customerName?: string; 
    address: string;
    startDate: string;  // Assuming startDate is a string in ISO format
    endDate: string;    // Assuming endDate is a string in ISO format
    engagements?: string;
    timeslot?: string;
    monthlyAmount?: number;
    paymentMode?: "CASH" | "CARD" | "ONLINE" | "UPI" | "razorpay";  // Assuming predefined payment modes
    bookingType?: string;
    bookingDate?: string;  // ISO format date-time
    responsibilities?: any;
    serviceType?: string;
    mealType?: string;
    noOfPersons?: string;
    experience?: string;
    childAge?: string;
    taskStatus: "NOT_STARTED" | "STARTED" | "IN_PROGRESS" | "CANCELLED" | "COMPLETED"; 
    serviceeType?: string;
    active?: boolean;  // True or False
    payment_mode?: string;
    booking_type?: string;
    service_type?: string;
    start_time?: string;
    end_date?: string;
    base_amount?: number;
  };

  type Responsibility = {
    serviceCategory: string;
    type: string;
    serviceType: string;
    subCategory: string;
    peopleRange: string;
    frequency: number;
    pricePerMonth: number;
  };  