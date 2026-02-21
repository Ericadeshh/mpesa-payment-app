import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

export function usePayment() {
  const [paymentId, setPaymentId] = useState<Id<"payments"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = useAction(api.payments.initiateSTKPush);
  const payment = useQuery(
    api.payments.getPayment,
    paymentId ? { paymentId } : "skip",
  );

  const makePayment = async (amount: number, phoneNumber: string) => {
    setIsLoading(true);
    try {
      const result = await initiatePayment({
        amount,
        phoneNumber: phoneNumber.replace(/\D/g, ""),
      });

      if (result.success && result.paymentId) {
        setPaymentId(result.paymentId as Id<"payments">);
      }

      return result;
    } catch (error) {
      console.error("Payment error:", error);
      return { success: false, error: "Failed to initiate payment" };
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
