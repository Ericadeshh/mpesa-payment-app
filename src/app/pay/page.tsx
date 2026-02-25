"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayment } from "@/hooks/usePayment";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PaymentStatus from "@/components/payments/PaymentStatus";
import {
  Phone,
  Shield,
  Zap,
  HeadphonesIcon,
  CreditCard,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Loading skeleton
function PayPageSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <div className="fixed inset-0 bg-gray-50 -z-20" />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-5 w-96 bg-gray-200 rounded-lg animate-pulse mx-auto" />
        </div>
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Main payment component
function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { makePayment, payment, isLoading } = usePayment();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [callingWebhook, setCallingWebhook] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Get parameters from external system
  const externalAmount = searchParams.get("amount");
  const externalPhone = searchParams.get("phone");
  const returnUrl = searchParams.get("returnUrl");
  const serviceName = searchParams.get("service") || "Aderoute";
  const isAmountFixed = searchParams.get("fixed") === "true";
  const customerId = searchParams.get("customer");

  // Debug logging
  useEffect(() => {
    console.log(
      "🔍 PAYMENT DEBUG - All URL params:",
      Object.fromEntries(searchParams),
    );
    console.log("🔍 PAYMENT DEBUG - returnUrl raw:", returnUrl);
    if (returnUrl) {
      try {
        const decoded = decodeURIComponent(returnUrl);
        console.log("🔍 PAYMENT DEBUG - returnUrl decoded:", decoded);
        const url = new URL(decoded);
        console.log("🔍 PAYMENT DEBUG - returnUrl origin:", url.origin);
        console.log("🔍 PAYMENT DEBUG - returnUrl pathname:", url.pathname);
        console.log("🔍 PAYMENT DEBUG - returnUrl search:", url.search);
      } catch (e) {
        console.error("🔍 PAYMENT DEBUG - Failed to parse returnUrl:", e);
      }
    }
  }, [searchParams, returnUrl]);

  // Pre-fill form with external data
  useEffect(() => {
    if (externalAmount) setAmount(externalAmount);
    if (externalPhone) setPhoneNumber(externalPhone);
  }, [externalAmount, externalPhone]);

  // Call ISP billing webhook to record payment
  const callWebhook = async (transactionId: string, status: string) => {
    if (!returnUrl) return;

    setCallingWebhook(true);
    try {
      const baseUrl = new URL(decodeURIComponent(returnUrl)).origin;
      const webhookUrl = `${baseUrl}/api/mpesa-webhook`;

      console.log(`📡 Calling webhook: ${webhookUrl}`);
      console.log(`📡 With data:`, {
        transactionId,
        amount: parseFloat(amount),
        phone: phoneNumber,
        planCode: parseFloat(amount),
        customerId,
        status,
      });

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          amount: parseFloat(amount),
          phone: phoneNumber,
          planCode: parseFloat(amount),
          customerId,
          status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Webhook called successfully:", data);
      } else {
        console.error("❌ Webhook failed:", data);
      }
    } catch (error) {
      console.error("❌ Webhook error:", error);
    } finally {
      setCallingWebhook(false);
    }
  };

  // Monitor payment status and redirect
  useEffect(() => {
    const handlePaymentCompletion = async () => {
      if (!payment || !returnUrl || redirecting) return;

      if (payment.status === "completed" && paymentInitiated) {
        setRedirecting(true);
        console.log("✅ Payment completed, preparing redirect...");

        await callWebhook(payment.transactionId || "", "success");

        // 🔧 FIXED: Parse the original returnUrl and force correct hostname
        const fullReturnUrl = new URL(decodeURIComponent(returnUrl));
        console.log("🔧 Original returnUrl hostname:", fullReturnUrl.hostname);

        // FORCE the correct hostname (THIS IS THE CRITICAL FIX)
        if (fullReturnUrl.hostname === "isp-billing-system.vercel.app") {
          fullReturnUrl.hostname = "isp-billing-system-sand.vercel.app";
          console.log("🔧 Fixed hostname to sandbox:", fullReturnUrl.hostname);
        }

        // Add payment details to the URL while preserving existing params
        fullReturnUrl.searchParams.append(
          "transactionId",
          payment.transactionId || "",
        );
        fullReturnUrl.searchParams.append("status", "success");
        fullReturnUrl.searchParams.append("amount", amount);
        fullReturnUrl.searchParams.append("phone", phoneNumber);
        if (customerId)
          fullReturnUrl.searchParams.append("customer", customerId);

        console.log("✅ Final redirect URL:", fullReturnUrl.toString());

        setTimeout(() => {
          window.location.href = fullReturnUrl.toString();
        }, 2000);
      }

      if (payment.status === "failed" && paymentInitiated) {
        setRedirecting(true);
        console.log("❌ Payment failed, redirecting to home...");

        await callWebhook(payment.transactionId || "", "failed");

        // For failed payments, extract base URL and force correct hostname
        const fullReturnUrl = new URL(decodeURIComponent(returnUrl));

        // Force correct hostname even for failed payments
        if (fullReturnUrl.hostname === "isp-billing-system.vercel.app") {
          fullReturnUrl.hostname = "isp-billing-system-sand.vercel.app";
        }

        // Redirect to the home page (just the origin)
        const baseUrl = fullReturnUrl.origin;
        console.log("❌ Redirecting to home:", baseUrl);

        setTimeout(() => {
          window.location.href = baseUrl;
        }, 3000);
      }
    };

    handlePaymentCompletion();
  }, [
    payment,
    returnUrl,
    amount,
    phoneNumber,
    paymentInitiated,
    customerId,
    redirecting,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      alert("Please enter a valid amount");
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);
    setPaymentFailed(false);

    try {
      const result = await makePayment(numAmount, cleanPhone);
      if (result.success) {
        setPaymentInitiated(true);
        console.log("✅ Payment initiated, waiting for confirmation...");
      } else {
        alert(result.error || "Payment failed");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred during payment");
      setIsSubmitting(false);
    }
  };

  // Show payment failed state
  if (paymentFailed || redirecting) {
    return (
      <main className="min-h-screen bg-white">
        <div className="fixed inset-0 bg-gray-50 -z-20" />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/50">
              {paymentFailed ? (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h1 className="text-2xl font-bold text-navy-dark mb-2">
                    Payment Failed
                  </h1>
                  <p className="text-gray-600 mb-4">
                    Your transaction could not be completed. Redirecting...
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <RefreshCw className="w-10 h-10 text-green-600 animate-spin" />
                  </div>
                  <h1 className="text-2xl font-bold text-navy-dark mb-2">
                    {payment?.status === "completed"
                      ? "Payment Successful!"
                      : "Processing..."}
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {payment?.status === "completed"
                      ? "Redirecting you back to the service..."
                      : "Please wait..."}
                  </p>
                </>
              )}
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="fixed inset-0 bg-gray-50 -z-20" />

      {/* External Service Banner */}
      {returnUrl && !paymentInitiated && (
        <div className="bg-amber-50 border-b border-amber-200 py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Processing payment for{" "}
                <span className="font-semibold mx-1">{serviceName}</span>
              </p>
              <Link
                href={decodeURIComponent(returnUrl).split("?")[0]}
                className="text-sm text-amber-700 hover:text-amber-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cancel
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <svg
              className="w-20 h-20 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">
            M-Pesa Express
          </h1>
          <p className="text-amber-600 max-w-md mx-auto">
            Complete your payment for {serviceName}
          </p>
        </div>

        {/* Payment Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            {/* Security badge */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-700">256-bit SSL Secured</span>
            </div>

            {!paymentInitiated ? (
              // Payment Form
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone number input */}
                <Input
                  label="Phone Number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="254 700 000 000"
                  required
                  icon={<Phone className="w-5 h-5" />}
                />

                {/* Amount input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (KES)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) =>
                        !isAmountFixed && setAmount(e.target.value)
                      }
                      placeholder="100"
                      required
                      min={1}
                      disabled={isAmountFixed}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 ${
                        isAmountFixed
                          ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-white border-gray-200 focus:border-green-500 focus:ring-green-200 text-gray-900"
                      }`}
                    />
                  </div>
                  {isAmountFixed && (
                    <p className="text-xs text-gray-500 mt-1">
                      Amount is fixed by {serviceName}
                    </p>
                  )}
                </div>

                {/* Quick amount selector */}
                {!isAmountFixed && (
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 500, 1000].map((quickAmount) => (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="py-2 px-1 text-sm font-medium bg-gray-100 hover:bg-green-100 
                                 text-gray-700 hover:text-green-700 rounded-lg transition-colors 
                                 border border-gray-200 hover:border-green-300"
                      >
                        KES {quickAmount}
                      </button>
                    ))}
                  </div>
                )}

                {/* Submit button */}
                <Button type="submit" loading={isSubmitting || isLoading}>
                  Pay with M-Pesa
                </Button>
              </form>
            ) : (
              // Payment Status View
              <div className="space-y-6">
                <PaymentStatus payment={payment} loading={!payment} />

                {payment?.status === "pending" && (
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      Please check your phone and enter your M-Pesa PIN to
                      complete the payment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Feature highlights */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-700">Instant</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-700">Secure</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <HeadphonesIcon className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-700">24/7 Support</p>
              </div>
            </div>
          </div>

          {/* Instructional message */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm text-gray-700">
                You&apos;ll receive an STK push on your phone
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Main export with Suspense
export default function PayPage() {
  return (
    <Suspense fallback={<PayPageSkeleton />}>
      <PayPageContent />
    </Suspense>
  );
}
