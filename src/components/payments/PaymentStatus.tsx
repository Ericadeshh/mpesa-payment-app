import { Payment } from "@/types/payment";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";

interface PaymentStatusProps {
  payment: Payment | null | undefined; // ← This is the fix
  loading: boolean;
}

export default function PaymentStatus({
  payment,
  loading,
}: PaymentStatusProps) {
  if (loading) {
    return (
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">
              Checking payment status...
            </p>
            <p className="text-sm text-blue-600">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  const statusConfig = {
    pending: {
      bg: "from-yellow-50 to-orange-50",
      border: "border-yellow-200",
      icon: Clock,
      iconColor: "text-yellow-500",
      title: "Waiting for confirmation",
      message:
        "Please check your phone and enter your M-Pesa PIN to complete the payment.",
      bgIcon: "bg-yellow-100",
    },
    completed: {
      bg: "from-green-50 to-emerald-50",
      border: "border-green-200",
      icon: CheckCircle,
      iconColor: "text-green-500",
      title: "Payment Successful!",
      message: "Your transaction has been completed successfully.",
      bgIcon: "bg-green-100",
    },
    failed: {
      bg: "from-red-50 to-rose-50",
      border: "border-red-200",
      icon: XCircle,
      iconColor: "text-red-500",
      title: "Payment Failed",
      message: "We couldn't process your payment. Please try again.",
      bgIcon: "bg-red-100",
    },
  };

  const config = statusConfig[payment.status];
  const Icon = config.icon;

  return (
    <div
      className={`mt-8 p-6 bg-gradient-to-br ${config.bg} border ${config.border} rounded-2xl shadow-sm`}
    >
      <div className="flex items-start space-x-4">
        <div className={`${config.bgIcon} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{config.title}</h3>
          <p className="text-gray-600 mt-1">{config.message}</p>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center py-2 border-t border-gray-200">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-900">
                KES {payment.amount.toLocaleString()}
              </span>
            </div>
            {payment.transactionId && (
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono text-sm text-gray-900">
                  {payment.transactionId}
                </span>
              </div>
            )}
            {payment.status === "completed" && (
              <button className="mt-4 w-full flex items-center justify-center space-x-2 text-green-600 font-medium">
                <span>View Receipt</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
