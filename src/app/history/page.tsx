import PaymentHistoryClient from "@/components/payments/PaymentHistoryClient";

export const metadata = {
  title: "Payment History | Aderoute",
  description: "View your M-Pesa transaction history",
};

export default function HistoryPage() {
  return (
    <main className="min-h-screen">
      {/* Clean background - same as home page */}
      <div className="fixed inset-0 bg-gray-50 -z-20" />

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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-amber-600 mb-2">
            Payment History
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            View and track all your M-Pesa transactions in one place
          </p>
        </div>

        {/* Payment History Client Component */}
        <PaymentHistoryClient />
      </div>
    </main>
  );
}
