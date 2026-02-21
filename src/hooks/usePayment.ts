import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Payment interface matching the database schema
 * This ensures type safety when working with payment data throughout the app
 */
export interface Payment {
  _id: Id<"payments">;
  _creationTime: number;
  amount: number;
  phoneNumber: string;
  status: "pending" | "completed" | "failed";
  checkoutRequestId?: string;
  transactionId?: string;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Formats a phone number to international format (254...)
 *
 * Accepts various input formats and converts to the standard required by M-Pesa:
 * - 07XXXXXXXX  (e.g., 0741091661)  → 254741091661
 * - 2547XXXXXXXX (e.g., 254741091661) → 254741091661 (unchanged)
 * - 7XXXXXXXX    (e.g., 741091661)    → 254741091661
 *
 * @param phone - Raw phone number input from user
 * @returns Formatted phone number in international format (12 digits)
 * @throws Error if phone number is invalid after cleaning
 */
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters (spaces, dashes, brackets, etc.)
  const cleaned = phone.replace(/\D/g, "");

  // Handle empty input
  if (!cleaned) {
    throw new Error("Phone number is required");
  }

  // Case 1: Already in international format (2547XXXXXXXX)
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }

  // Case 2: Local format with leading 0 (07XXXXXXXX)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "254" + cleaned.substring(1);
  }

  // Case 3: Just the 9 digits after 07 (7XXXXXXXX)
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return "254" + cleaned;
  }

  // Case 4: 10 digits starting with something else? Could be invalid
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    throw new Error(
      "Invalid phone format. Please use 07XXXXXXXX or 2547XXXXXXXX",
    );
  }

  // If we get here, the format is unrecognized
  throw new Error(
    `Invalid phone number format. Expected 07XXXXXXXX or 2547XXXXXXXX, got ${phone}`,
  );
};

/**
 * Custom hook for M-Pesa payments
 *
 * This hook encapsulates all payment-related logic and state:
 * - Initiating STK push via Convex action
 * - Tracking payment status via real-time query
 * - Managing loading states
 * - Formatting phone numbers
 *
 * @returns Object containing:
 *   - makePayment: Function to initiate payment
 *   - payment: Current payment data (auto-updates)
 *   - isLoading: Boolean indicating if payment is processing
 */
export function usePayment() {
  const [paymentId, setPaymentId] = useState<Id<"payments"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Action to initiate STK push (calls M-Pesa API via Convex)
  const initiatePayment = useAction(api.payments.initiateSTKPush);

  // Query to get payment status (auto-updates when paymentId changes)
  // Uses "skip" to avoid querying when no payment is selected
  const payment = useQuery(
    api.payments.getPayment,
    paymentId ? { paymentId } : "skip",
  );

  /**
   * Initiates an M-Pesa STK push to the customer's phone
   *
   * @param amount - Amount to charge in KES (must be between 1 and 150,000)
   * @param phoneNumber - Customer's phone number (accepts 07..., 2547..., or 7... formats)
   * @returns Result object with success status and payment details
   */
  const makePayment = async (amount: number, phoneNumber: string) => {
    setIsLoading(true);
    try {
      // Validate amount range
      if (amount < 1) {
        throw new Error("Amount must be at least KES 1");
      }
      if (amount > 150000) {
        throw new Error("Amount cannot exceed KES 150,000");
      }

      // Format phone number to international standard (254...)
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log(`📱 Formatted phone: ${phoneNumber} → ${formattedPhone}`);

      // Call the Convex action to initiate STK push
      const result = await initiatePayment({
        amount,
        phoneNumber: formattedPhone,
      });

      // If successful, save the payment ID for status tracking
      if (result.success && result.paymentId) {
        setPaymentId(result.paymentId as Id<"payments">);
        console.log(`✅ Payment initiated with ID: ${result.paymentId}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Payment error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to initiate payment",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    makePayment,
    payment: payment as Payment | null | undefined,
    isLoading,
  };
}
