"use client";

import { useState, useEffect, Suspense } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useSearchParams } from "next/navigation";
import Input from "../ui/Input";
import Button from "../ui/Button";
import PaymentStatus from "./PaymentStatus";
import {
  Phone,
  Shield,
  Zap,
  HeadphonesIcon,
  CreditCard,
  ExternalLink,
} from "lucide-react";

interface PaymentFormProps {
  initialAmount?: string;
  initialPhone?: string;
}

// Loading skeleton for the payment form
function PaymentFormSkeleton() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-xs text-gray-700">256-bit SSL Secured</span>
        </div>

        <div className="space-y-6">
          {/* Phone number field skeleton */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>

          {/* Amount field skeleton */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>

          {/* Quick amount buttons skeleton */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>

          {/* Submit button skeleton */}
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Feature highlights skeleton */}
        <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component that uses useSearchParams
function PaymentFormContent({ initialAmount, initialPhone }: PaymentFormProps) {
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState(initialAmount || "");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || "");
  const { makePayment, payment, isLoading } = usePayment();

  const returnUrl = searchParams.get("returnUrl");
  const serviceName = searchParams.get("service") || "Aderoute";

  // Pre-fill from URL params if available
  useEffect(() => {
    const urlAmount = searchParams.get("amount");
    const urlPhone = searchParams.get("phone");

    if (urlAmount && !amount) setAmount(urlAmount);
    if (urlPhone && !phoneNumber) setPhoneNumber(urlPhone);
  }, [searchParams, amount, phoneNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      alert("Please enter a valid amount");
      return;
    }

    // Format phone number (remove any non-digits)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    const result = await makePayment(numAmount, cleanPhone);
    if (!result.success) {
      alert(result.error || "Payment failed");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* External Service Indicator */}
      {returnUrl && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
          <ExternalLink className="w-4 h-4 text-amber-600 mr-2" />
          <p className="text-xs text-amber-700">
            Processing payment for{" "}
            <span className="font-semibold">{serviceName}</span>
          </p>
        </div>
      )}

      {/* Main payment card with frosted glass effect */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
        {/* Security badge for trust signal */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-xs text-gray-700">256-bit SSL Secured</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone number input field */}
          <Input
            label="Phone Number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="254 700 000 000"
            required
            icon={<Phone className="w-5 h-5" />}
          />

          {/* Amount input field */}
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

          {/* Quick amount selector buttons for convenience */}
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

          {/* Submit button with loading state */}
          <Button type="submit" loading={isLoading}>
            Pay with M-Pesa
          </Button>
        </form>

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

        {/* Payment status display */}
        <PaymentStatus payment={payment} loading={isLoading} />
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
  );
}

// Main exported component with Suspense wrapper
export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Suspense fallback={<PaymentFormSkeleton />}>
      <PaymentFormContent {...props} />
    </Suspense>
  );
}
