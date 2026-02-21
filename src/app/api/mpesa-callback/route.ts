import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";

// Initialize Convex HTTP client for calling mutations from API routes
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * M-Pesa Callback Handler
 *
 * This endpoint receives payment confirmation callbacks from Safaricom
 * when an STK push transaction completes (success or failure).
 *
 * M-Pesa expects a 200 response with specific JSON structure.
 * Even if we encounter errors, we must return 200 to acknowledge receipt.
 */
export async function POST(request: Request) {
  try {
    // Parse the callback data from M-Pesa
    const callbackData = await request.json();
    console.log(
      "📨 M-Pesa Callback received:",
      JSON.stringify(callbackData, null, 2),
    );

    // Extract the relevant information from the callback
    const stkCallback = callbackData.Body.stkCallback;
    const {
      CheckoutRequestID, // Unique ID from original STK push
      ResultCode, // 0 = success, any other = failure
      ResultDesc, // Human-readable result description
      CallbackMetadata, // Additional data for successful transactions
    } = stkCallback;

    // Handle successful transaction (ResultCode === 0)
    if (ResultCode === 0) {
      // Extract metadata items into a key-value object
      // Items typically include: Amount, MpesaReceiptNumber, Balance, TransactionDate, PhoneNumber
      const metadata = CallbackMetadata.Item.reduce((acc: any, item: any) => {
        acc[item.Name] = item.Value;
        return acc;
      }, {});

      console.log("💰 Payment successful:", metadata);

      // Update payment status in Convex database
      // Note: phoneNumber may come as 254741091661.0 (with decimal)
      await convex.mutation(api.payments.updatePaymentStatusFromCallback, {
        checkoutRequestId: CheckoutRequestID,
        status: "completed",
        transactionId: metadata.MpesaReceiptNumber,
        amount: metadata.Amount,
        phoneNumber: metadata.PhoneNumber, // Will be normalized in the mutation
      });

      console.log(`✅ Payment ${CheckoutRequestID} completed successfully`);
    }
    // Handle failed transaction (ResultCode !== 0)
    else {
      console.log(`❌ Payment failed: ${ResultDesc}`);

      await convex.mutation(api.payments.updatePaymentStatusFromCallback, {
        checkoutRequestId: CheckoutRequestID,
        status: "failed",
        failureReason: ResultDesc,
      });

      console.log(`❌ Payment ${CheckoutRequestID} failed: ${ResultDesc}`);
    }

    // Always return success to M-Pesa (they expect 200 OK)
    // Even if our internal processing failed, we must acknowledge receipt
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  } catch (error) {
    // Log the error but still return 200 to M-Pesa
    console.error("Error processing callback:", error);

    return NextResponse.json(
      {
        ResultCode: 1,
        ResultDesc: "Internal server error",
      },
      { status: 200 }, // Still return 200 to acknowledge receipt
    );
  }
}
