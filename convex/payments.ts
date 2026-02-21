import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ===== INTERNAL MUTATIONS (for database operations) =====
// These are not exposed to the client

export const insertPayment = internalMutation({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payments", {
      amount: args.amount,
      phoneNumber: args.phoneNumber,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updatePaymentCheckoutId = internalMutation({
  args: {
    paymentId: v.id("payments"),
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      checkoutRequestId: args.checkoutRequestId,
    });
  },
});

export const updatePaymentStatus = internalMutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.transactionId) {
      patch.transactionId = args.transactionId;
    }
    await ctx.db.patch(args.paymentId, patch);
  },
});

// ===== PUBLIC QUERIES =====

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

export const getPaymentsByPhone = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .order("desc")
      .take(10);
  },
});

// ===== PUBLIC ACTION (for M-Pesa API calls) =====

// Helper functions for M-Pesa
const getTimestamp = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const getPassword = (
  shortcode: string,
  passkey: string,
  timestamp: string,
): string => {
  const str = shortcode + passkey + timestamp;
  return btoa(str);
};

const getAccessToken = async (): Promise<string> => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  );
  const data = await response.json();
  return data.access_token;
};

export const initiateSTKPush = action({
  args: {
    amount: v.number(),
    phoneNumber: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    checkoutRequestId?: string;
    paymentId?: Id<"payments">;
    error?: string;
  }> => {
    const { amount, phoneNumber } = args;

    try {
      // 1. Insert payment record (using internal mutation)
      const paymentId = await ctx.runMutation(internal.payments.insertPayment, {
        amount,
        phoneNumber,
      });

      // 2. Prepare M-Pesa request
      const timestamp = getTimestamp();
      const password = getPassword(
        process.env.MPESA_SHORTCODE!,
        process.env.MPESA_PASSKEY!,
        timestamp,
      );
      const token = await getAccessToken();

      // 3. Call M-Pesa API
      const response = await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: "https://your-domain.com/api/mpesa-callback", // Update this later
            AccountReference: "Payment",
            TransactionDesc: "Payment",
          }),
        },
      );

      const result = await response.json();

      // 4. Update with checkout request ID
      if (result.CheckoutRequestID) {
        await ctx.runMutation(internal.payments.updatePaymentCheckoutId, {
          paymentId,
          checkoutRequestId: result.CheckoutRequestID,
        });
      }

      return {
        success: true,
        checkoutRequestId: result.CheckoutRequestID,
        paymentId,
      };
    } catch (error) {
      console.error("STK Push error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  },
});
