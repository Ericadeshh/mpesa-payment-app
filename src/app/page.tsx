import PaymentForm from "@/components/payments/PaymentForm";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Simple, clean background - no gradients */}
      <div className="fixed inset-0 bg-gray-50 -z-20" />

      {/* Removed all decorative elements - no blue gradients, no green backgrounds */}

      <div className="container mx-auto px-4 py-12">
        {/* Header section with app title and description - NO BACKGROUND */}
        <div className="text-center mb-12">
          {/* Simple icon without green background */}
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
          <p className="text-gray-600 max-w-md mx-auto">
            Fast, secure payments directly from your phone. Enter your details
            below to get started.
          </p>
        </div>

        {/* Main payment form component */}
        <PaymentForm />

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
