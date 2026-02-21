import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// INTERNAL MUTATIONS
// These functions are only called from within other Convex functions (actions)
// They are NOT exposed to the client or API routes directly
// ============================================================================

/**
 * Creates a new payment record in the database with 'pending' status
 * Called when a user initiates an STK push from the frontend
 *
 * @param amount - Payment amount in KES
 * @param phoneNumber - Customer's phone number in international format (254XXXXXXXX)
 * @returns The ID of the newly created payment record
 */
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

/**
 * Updates a payment record with the CheckoutRequestID from M-Pesa
 * This ID is used to match incoming callbacks to the correct payment
 *
 * @param paymentId - Our internal payment ID
 * @param checkoutRequestId - M-Pesa's transaction reference
 */
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

// ============================================================================
// PUBLIC MUTATIONS
// These can be called from API routes (like our callback endpoint)
// They handle updating payment status based on M-Pesa confirmation
// ============================================================================

/**
 * Updates payment status when M-Pesa sends a callback
 * Called from our /api/mpesa-callback route when a transaction completes or fails
 *
 * IMPORTANT: M-Pesa sometimes sends numbers with decimals (e.g., 254741091661.0)
 * This function handles that by converting to string properly
 *
 * @param checkoutRequestId - M-Pesa's transaction reference (used to find our payment)
 * @param status - Final status from M-Pesa (completed or failed)
 * @param transactionId - M-Pesa receipt number (for successful payments)
 * @param amount - Confirmed amount from M-Pesa
 * @param phoneNumber - Customer's phone number (may include .0)
 * @param failureReason - Error message (for failed payments)
 */
export const updatePaymentStatusFromCallback = mutation({
  args: {
    checkoutRequestId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    transactionId: v.optional(v.string()),
    amount: v.optional(v.number()),
    phoneNumber: v.optional(v.union(v.string(), v.number())), // Accept both string and number
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(
      `📞 Callback received for CheckoutRequestID: ${args.checkoutRequestId}`,
    );

    // Find the original payment using the CheckoutRequestID from M-Pesa
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkoutRequestId", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId),
      )
      .first();

    // If no matching payment found, log error but don't throw (M-Pesa expects 200 response)
    if (!payment) {
      console.error(
        `❌ Payment not found for checkoutRequestId: ${args.checkoutRequestId}`,
      );
      return;
    }

    console.log(
      `✅ Found payment: ${payment._id}, current status: ${payment.status}`,
    );

    // Prepare update object with common fields
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Add transaction ID if provided (for successful payments)
    if (args.transactionId) {
      updates.transactionId = args.transactionId;
    }

    // Handle phone number - M-Pesa sometimes sends it as 254741091661.0
    if (args.phoneNumber) {
      // Convert to string and remove .0 if present
      updates.phoneNumber = String(args.phoneNumber).replace(".0", "");
      console.log(
        `📱 Phone number normalized: ${args.phoneNumber} → ${updates.phoneNumber}`,
      );
    }

    // Apply the update to the database
    await ctx.db.patch(payment._id, updates);

    console.log(`✅ Payment ${payment._id} updated to ${args.status}`);
    if (args.transactionId) {
      console.log(`   Transaction ID: ${args.transactionId}`);
    }

    return payment._id;
  },
});

// ============================================================================
// PUBLIC QUERIES
// These can be called directly from the frontend to retrieve payment data
// ============================================================================

/**
 * Fetches a single payment by its ID
 * Used by the frontend to check status of a specific payment
 *
 * @param paymentId - The ID of the payment to fetch
 * @returns The payment object or null if not found
 */
export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

/**
 * Fetches all payments made by a specific phone number
 * Used for displaying payment history to users
 *
 * @param phoneNumber - Customer's phone number
 * @returns Array of payments (most recent first, limited to 10)
 */
export const getPaymentsByPhone = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .order("desc") // Most recent first
      .take(10); // Limit to last 10 payments
  },
});

/**
 * Fetches all payments (admin view)
 * Useful for dashboard and monitoring
 *
 * @returns Array of recent payments (limited to 50)
 */
export const getAllPayments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("payments").order("desc").take(50); // Get last 50 payments
  },
});

// ============================================================================
// PUBLIC ACTION
// This is the main entry point for initiating M-Pesa payments from the frontend
// Actions can make external API calls (unlike queries and mutations)
// ============================================================================

/**
 * Generates the timestamp required for M-Pesa API in format YYYYMMDDHHmmss
 * Example: 20260221143015 (Feb 21, 2026 at 2:30:15 PM)
 *
 * @returns Current timestamp in M-Pesa required format
 */
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

/**
 * Generates the password required for M-Pesa API
 * Password = Base64(Shortcode + Passkey + Timestamp)
 *
 * @param shortcode - Business shortcode (PayBill/Till number)
 * @param passkey - M-Pesa API passkey
 * @param timestamp - Current timestamp in M-Pesa format
 * @returns Base64 encoded password
 */
const getPassword = (
  shortcode: string,
  passkey: string,
  timestamp: string,
): string => {
  const str = shortcode + passkey + timestamp;
  return btoa(str); // btoa works in both browser and Convex environments
};

/**
 * Gets an OAuth access token from M-Pesa API
 * Token is required for all subsequent API calls
 *
 * @returns Access token string
 * @throws Error if token request fails
 */
const getAccessToken = async (): Promise<string> => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;

  // Create Basic Auth string (Base64 encoded consumerKey:consumerSecret)
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  // Request access token from M-Pesa
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

/**
 * Initiates an STK Push to the customer's phone
 * This is the main function called from the frontend when user clicks "Pay with M-Pesa"
 *
 * @param amount - Amount to charge in KES
 * @param phoneNumber - Customer's phone number (must be in international format: 254XXXXXXXX)
 * @returns Object with success status, checkoutRequestId, paymentId, or error message
 */
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
      // STEP 1: Create a pending payment record in our database
      // This gives us an ID to track the payment through its lifecycle
      console.log(`💰 Initiating payment: KES ${amount} to ${phoneNumber}`);

      const paymentId = await ctx.runMutation(internal.payments.insertPayment, {
        amount,
        phoneNumber,
      });

      // STEP 2: Prepare M-Pesa API request parameters
      const timestamp = getTimestamp();
      const password = getPassword(
        process.env.MPESA_SHORTCODE!,
        process.env.MPESA_PASSKEY!,
        timestamp,
      );

      // Get access token for API authentication
      const token = await getAccessToken();
      console.log("🔑 Access token obtained successfully");

      // STEP 3: Call M-Pesa API to initiate STK Push
      const response = await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            BusinessShortCode: process.env.MPESA_SHORTCODE, // PayBill/Till number
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline", // Payment type
            Amount: amount,
            PartyA: phoneNumber, // Customer pays from this number
            PartyB: process.env.MPESA_SHORTCODE, // Money goes to this account
            PhoneNumber: phoneNumber, // Where to send STK push
            CallBackURL:
              "https://illiberal-cecil-dispersible.ngrok-free.dev/api/mpesa-callback",
            AccountReference: "Payment", // Reference shown to customer
            TransactionDesc: "Payment", // Description
          }),
        },
      );

      const result = await response.json();
      console.log("📨 M-Pesa response:", result);

      // STEP 4: If M-Pesa accepted the request, save the CheckoutRequestID
      // This ID will be used when M-Pesa sends the callback
      if (result.CheckoutRequestID) {
        await ctx.runMutation(internal.payments.updatePaymentCheckoutId, {
          paymentId,
          checkoutRequestId: result.CheckoutRequestID,
        });
        console.log(`✅ CheckoutRequestID saved: ${result.CheckoutRequestID}`);
      }

      // STEP 5: Return success response to frontend
      return {
        success: true,
        checkoutRequestId: result.CheckoutRequestID,
        paymentId,
      };
    } catch (error) {
      // Log error and return failure response
      console.error("❌ STK Push error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  },
});
