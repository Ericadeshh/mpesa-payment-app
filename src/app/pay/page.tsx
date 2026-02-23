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
} from "lucide-react";
import Link from "next/link";

// Loading skeleton for the payment form
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

  // Get parameters from external system
  const externalAmount = searchParams.get("amount");
  const externalPhone = searchParams.get("phone");
  const returnUrl = searchParams.get("returnUrl");
  const serviceName = searchParams.get("service") || "Aderoute";

  // Pre-fill form with external data
  useEffect(() => {
    if (externalAmount) setAmount(externalAmount);
    if (externalPhone) setPhoneNumber(externalPhone);
  }, [externalAmount, externalPhone]);

  // Monitor payment status and redirect only when completed
  useEffect(() => {
    const checkPaymentAndRedirect = async () => {
      // Only proceed if we have a payment and it's completed
      if (payment?.status === "completed" && paymentInitiated) {
        console.log("✅ Payment completed, redirecting...");

        // Get the base returnUrl - if none exists, use a default based on service
        let baseReturnUrl = returnUrl;
        if (!baseReturnUrl) {
          // Check if this is for the ISP billing system (based on plan parameter)
          const planParam = searchParams.get("plan");
          if (planParam) {
            baseReturnUrl = `${window.location.origin}/payment-confirm`;
          } else {
            baseReturnUrl = `${window.location.origin}/hotspot/success`;
          }
        }

        // Construct redirect URL with payment details
        const redirectUrl = new URL(decodeURIComponent(baseReturnUrl));
        redirectUrl.searchParams.append(
          "transactionId",
          payment.transactionId || "",
        );
        redirectUrl.searchParams.append("status", "success");
        redirectUrl.searchParams.append("amount", amount);
        redirectUrl.searchParams.append("phone", phoneNumber);

        // Important: Add plan parameter if it exists
        const planParam = searchParams.get("plan");
        if (planParam) {
          redirectUrl.searchParams.append("plan", planParam);
        }

        // Add customer ID if you have it
        const customerParam = searchParams.get("customer");
        if (customerParam) {
          redirectUrl.searchParams.append("customer", customerParam);
        }

        // Small delay to ensure user sees success message
        setTimeout(() => {
          window.location.href = redirectUrl.toString();
        }, 2000);
      }
    };

    checkPaymentAndRedirect();
  }, [payment, paymentInitiated, returnUrl, amount, phoneNumber, searchParams]);

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
                href={decodeURIComponent(returnUrl)}
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
            Fast, secure payments directly from your phone. Complete your
            payment below.
          </p>
        </div>

        {/* Payment Form - Exactly matching the original */}
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
                <Input
                  label="Amount (KES)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  required
                  min={1}
                  icon={<CreditCard className="w-5 h-5" />}
                />

                {/* Quick amount selector */}
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

                {/* Submit button */}
                <Button type="submit" loading={isSubmitting || isLoading}>
                  Pay with M-Pesa
                </Button>
              </form>
            ) : (
              // Payment Status View - Shows exactly like the original
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

        {/* Trust badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Trusted by 1000+ businesses
          </p>
          <div className="flex justify-center space-x-8">
            <span className="text-gray-400 text-sm">✓ Secure</span>
            <span className="text-gray-400 text-sm">✓ Instant</span>
            <span className="text-gray-400 text-sm">✓ 24/7 Support</span>
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
