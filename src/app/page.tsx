import PaymentForm from "@/components/payments/PaymentForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50">
      {/* Decorative background elements for visual appeal */}
      <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-r from-green-600 to-green-400 opacity-10 -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 -z-10" />
      <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-500 rounded-full filter blur-3xl opacity-10 -z-10" />

      <div className="container mx-auto px-4 py-12">
        {/* Header section with app title and description */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            M-Pesa Express
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Fast, secure payments directly from your phone. Enter your details
            below to get started.
          </p>
        </div>

        {/* Main payment form component - handles all payment logic internally */}
        <PaymentForm />

        {/* Trust badges to build user confidence */}
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
