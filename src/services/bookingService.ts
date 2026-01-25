// BookingService.ts
/* eslint-disable */
import PaymentInstance from "./paymentInstance";
import store from "../store/userStore";
import RazorpayCheckout from "react-native-razorpay";

export interface BookingPayload {
  customerid: number;
  serviceproviderid: number | null;
  start_date?: string;
  end_date?: string;
  responsibilities: any;
  booking_type: string;
  service_type: string;
  base_amount: number;
  payment_mode?: "razorpay" | "UPI" | "CASH" | string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  engagementId: number;
}

// Location data interface
export interface LocationData {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Error types for better error handling
export interface RazorpayError {
  code: number;
  description: string;
}

export const BookingService = {
  /**
   * Create a new engagement
   */
  createEngagement: async (payload: BookingPayload) => {

    console.log("Creating engagement with payload:", payload);
    try {
      const res = await PaymentInstance.post(`/api/engagements`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (error) {
      console.error("Error creating engagement:", error);
      throw error;
    }
  },

  /**
   * Open Razorpay checkout
   */
  openRazorpay: async (
    orderId: string,
    amountPaise: number,
    currency = "INR"
  ): Promise<RazorpayPaymentResponse> => {
    return new Promise((resolve, reject) => {
      const options = {
        description: "Booking Payment",
        image: "https://your-logo-url.com/logo.png",
        currency,
        key: "rzp_test_lTdgjtSRlEwreA",
        amount: amountPaise,
        name: "Serveaso",
        order_id: orderId,
        prefill: {
          email: "test@example.com",
          contact: "9999999999",
          name: "Test User",
        },
        theme: { color: "#0ea5e9" },
        notes: {
          booking: "service_booking"
        },
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          if (!data.razorpay_payment_id || !data.razorpay_order_id || !data.razorpay_signature) {
            reject({
              code: -1,
              description: "Incomplete payment response from Razorpay"
            });
            return;
          }

          const resp: RazorpayPaymentResponse = {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            engagementId: 0,
          };
          resolve(resp);
        })
        .catch((error: any) => {
          console.error("Razorpay checkout error:", error);
          reject(error);
        });
    });
  },

  /**
   * Verify payment with backend
   */
  verifyPayment: async (paymentData: RazorpayPaymentResponse) => {
    try {
      const res = await PaymentInstance.post(`/api/payments/verify`, paymentData, {
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },

  /**
   * Complete booking and payment flow with location data
   */
  bookAndPay: async (payload: BookingPayload, locationData?: { latitude: number; longitude: number } | LocationData) => {
    try {
      let latitude = 0;
      let longitude = 0;

      // Use provided location data first (preferred method)
      if (locationData) {
        if ('geometry' in locationData) {
          // It's a LocationData object
          latitude = locationData.geometry.location.lat;
          longitude = locationData.geometry.location.lng;
        } else {
          // It's a simple coordinates object
          latitude = locationData.latitude;
          longitude = locationData.longitude;
        }
        console.log("Using provided location coordinates - lat:", latitude, "lng:", longitude);
      } else {
        // Fallback to Redux store (backward compatibility)
        const state: any = store.getState();
        const location = state?.geoLocation?.value ?? null;

        if (location?.geometry?.location) {
          latitude = location.geometry.location.lat;
          longitude = location.geometry.location.lng;
        } else if (location?.lat && location?.lng) {
          latitude = location.lat;
          longitude = location.lng;
        }
        console.log("Using Redux store coordinates - lat:", latitude, "lng:", longitude);
      }

      // Process payload
      payload.serviceproviderid = payload.serviceproviderid === 0 ? null : payload.serviceproviderid;
      payload.latitude = latitude;
      payload.longitude = longitude;

      console.log("Final payload with coordinates:", {
        ...payload,
        latitude,
        longitude
      });

      // Create engagement
      const engagementData = await BookingService.createEngagement(payload);

      // Extract order id & amount
      const orderId =
        engagementData?.payment?.razorpay_order_id ||
        engagementData?.razorpayOrder?.id;

      if (!orderId) {
        throw new Error("Razorpay order id not found in response");
      }

      // Calculate amount in paise
      let amountPaise: number;
      if (engagementData?.razorpayOrder?.amount) {
        amountPaise = Number(engagementData.razorpayOrder.amount);
      } else if (engagementData?.payment?.total_amount) {
        amountPaise = Math.round(Number(engagementData.payment.total_amount) * 100);
      } else {
        amountPaise = Math.round(payload.base_amount * 100);
      }

      console.log("Payment amount:", amountPaise, "paise");

      // Open Razorpay
      const paymentResponse = await BookingService.openRazorpay(
        orderId,
        amountPaise
      );

      // Set engagement ID for verification
      paymentResponse.engagementId = engagementData?.engagement?.engagement_id;

      // Verify payment on backend
      const verifyResult = await BookingService.verifyPayment(paymentResponse);

      return { 
        engagementData, 
        paymentResponse, 
        verifyResult 
      };

    } catch (error) {
      console.error("Error in bookAndPay flow:", error);
      throw error;
    }
  },

  /**
   * Alternative method for cash/UPI payments without Razorpay
   */
  bookWithoutOnlinePayment: async (payload: BookingPayload, locationData?: { latitude: number; longitude: number } | LocationData) => {
    try {
      let latitude = 0;
      let longitude = 0;

      // Use provided location data first
      if (locationData) {
        if ('geometry' in locationData) {
          latitude = locationData.geometry.location.lat;
          longitude = locationData.geometry.location.lng;
        } else {
          latitude = locationData.latitude;
          longitude = locationData.longitude;
        }
        console.log("Using provided location coordinates for cash payment - lat:", latitude, "lng:", longitude);
      } else {
        // Fallback to Redux store
        const state: any = store.getState();
        const location = state?.geoLocation?.value ?? null;

        if (location?.geometry?.location) {
          latitude = location.geometry.location.lat;
          longitude = location.geometry.location.lng;
        } else if (location?.lat && location?.lng) {
          latitude = location.lat;
          longitude = location.lng;
        }
      }

      payload.serviceproviderid = payload.serviceproviderid === 0 ? null : payload.serviceproviderid;
      payload.latitude = latitude;
      payload.longitude = longitude;
      payload.payment_mode = payload.payment_mode || "CASH";

      const engagementData = await BookingService.createEngagement(payload);
      
      return { 
        engagementData,
        paymentResponse: null,
        verifyResult: null
      };

    } catch (error) {
      console.error("Error in booking without online payment:", error);
      throw error;
    }
  },
};

/**
 * Utility: Convert 12h time format to 24h format
 */
export function to24Hour(timeStr: string): string {
  if (!timeStr) return timeStr;

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  let hrs = parseInt(hours, 10);

  if (modifier?.toLowerCase() === "pm" && hrs !== 12) {
    hrs += 12;
  }
  if (modifier?.toLowerCase() === "am" && hrs === 12) {
    hrs = 0;
  }

  return `${String(hrs).padStart(2, "0")}:${minutes}`;
}

/**
 * Utility: Format amount for display
 */
export function formatAmount(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export default BookingService;