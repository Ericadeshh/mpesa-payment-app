"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePayment } from "@/hooks/usePayment";
import {
  Phone,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

// Loading component for Suspense
function PaymentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
          <RefreshCw className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    </div>
  );
}

// Main payment component that uses searchParams
function PaymentContent() {
  const searchParams = useSearchParams();
  const { makePayment, isLoading } = usePayment();

  const [amount, setAmount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !phoneNumber) return;

    setIsProcessing(true);
    setPaymentStatus("processing");
    const numAmount = parseFloat(amount);

    try {
      const result = await makePayment(numAmount, phoneNumber);

      if (result.success && returnUrl) {
        setPaymentStatus("success");

        // After successful payment, redirect back
        const redirectUrl = new URL(decodeURIComponent(returnUrl));
        redirectUrl.searchParams.append(
          "transactionId",
          result.checkoutRequestId || "",
        );
        redirectUrl.searchParams.append("status", "success");
        redirectUrl.searchParams.append("amount", amount);
        redirectUrl.searchParams.append("phone", phoneNumber);

        setTimeout(() => {
          window.location.href = redirectUrl.toString();
        }, 2000);
      } else {
        setPaymentStatus("error");
        setErrorMessage(result.error || "Payment failed");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      setErrorMessage("An error occurred during payment");
      setIsProcessing(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-green-500 p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Payment Successful!
              </h1>
              <p className="text-green-50">
                Redirecting you back to {serviceName}...
              </p>
            </div>
            <div className="p-6 text-center">
              <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">
                You'll be redirected automatically in a moment.
              </p>
              {returnUrl && (
                <Link
                  href={decodeURIComponent(returnUrl)}
                  className="text-sm text-green-600 hover:text-green-700 mt-4 inline-block"
                >
                  Click here if not redirected
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        {/* External Service Badge */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Payment for {serviceName}
          </span>
        </div>

        {/* Return Link */}
        {returnUrl && (
          <Link
            href={decodeURIComponent(returnUrl)}
            className="inline-flex items-center text-gray-600 hover:text-green-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel and return
          </Link>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              M-Pesa Payment
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {paymentStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Payment Failed</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="text-3xl font-bold text-green-600 bg-green-50 p-4 rounded-xl text-center border-2 border-green-100">
                KES {parseFloat(amount).toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712345678"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-900"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading || isProcessing}
              className="w-full py-4 text-lg"
            >
              {isLoading || isProcessing ? "Processing..." : "Pay with M-Pesa"}
            </Button>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 text-center flex items-center justify-center">
                <Shield className="w-3 h-3 mr-1 text-green-500" />
                Secure payment powered by M-Pesa
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

// Main page component with Suspense
export default function PayPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentContent />
    </Suspense>
  );
}
