"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow, format } from "date-fns";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Calendar,
  TrendingUp,
  Wallet,
  AlertCircle,
  BarChart3,
  DollarSign,
} from "lucide-react";

// Status badge component with green theme
const StatusBadge = ({
  status,
}: {
  status: "pending" | "completed" | "failed";
}) => {
  const config = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: Clock,
      label: "Pending",
    },
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
      label: "Completed",
    },
    failed: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: XCircle,
      label: "Failed",
    },
  };

  const { bg, text, icon: Icon, label } = config[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  );
};

// Format phone number for display
const formatPhoneDisplay = (phone: string) => {
  if (phone.startsWith("254") && phone.length === 12) {
    return "0" + phone.substring(3);
  }
  return phone;
};

// Format relative time (e.g., "1 min", "2 hrs", "5d")
const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60)
    return `${diffInSeconds} sec${diffInSeconds !== 1 ? "s" : ""}`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} min${Math.floor(diffInSeconds / 60) !== 1 ? "s" : ""}`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hr${Math.floor(diffInSeconds / 3600) !== 1 ? "s" : ""}`;
  return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) !== 1 ? "s" : ""}`;
};

export default function PaymentHistoryClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "failed"
  >("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Fetch all payments
  const payments = useQuery(api.payments.getAllPayments);

  // Loading state
  if (payments === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Filter and sort payments
  const filteredPayments = payments
    ?.filter((payment) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesPhone =
          payment.phoneNumber.includes(searchLower) ||
          formatPhoneDisplay(payment.phoneNumber).includes(searchLower);
        const matchesAmount = payment.amount.toString().includes(searchTerm);
        const matchesTxId = payment.transactionId
          ?.toLowerCase()
          .includes(searchLower);

        if (!matchesPhone && !matchesAmount && !matchesTxId) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && payment.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateRange !== "all") {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        switch (dateRange) {
          case "today":
            if (now - payment.createdAt > oneDay) return false;
            break;
          case "week":
            if (now - payment.createdAt > oneWeek) return false;
            break;
          case "month":
            if (now - payment.createdAt > oneMonth) return false;
            break;
        }
      }

      return true;
    })
    .sort((a, b) => {
      return sortOrder === "desc"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt;
    });

  // Calculate statistics
  const stats = {
    total: payments?.length || 0,
    completed: payments?.filter((p) => p.status === "completed").length || 0,
    pending: payments?.filter((p) => p.status === "pending").length || 0,
    failed: payments?.filter((p) => p.status === "failed").length || 0,
    totalAmount:
      payments?.reduce(
        (sum, p) => sum + (p.status === "completed" ? p.amount : 0),
        0,
      ) || 0,
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Phone Number",
      "Amount",
      "Status",
      "Transaction ID",
      "Checkout Request ID",
    ];
    const csvData = filteredPayments.map((p) => [
      format(p.createdAt, "yyyy-MM-dd HH:mm:ss"),
      formatPhoneDisplay(p.phoneNumber),
      p.amount,
      p.status,
      p.transactionId || "",
      p.checkoutRequestId || "",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Cards in priority order: Total Amount first, then Completed, then others
  const cards = [
    // Most important: Total Amount
    {
      title: "Total Amount",
      value: `KES ${stats.totalAmount.toLocaleString()}`,
      icon: DollarSign,
      bg: "bg-gradient-to-br from-emerald-800 to-green-900",
      iconColor: "text-white",
      textColor: "text-white",
      valueColor: "text-white",
      hoverEffect: "hover:from-emerald-800 hover:to-green-900 hover:shadow-2xl",
    },
    // Second most important: Completed
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      bg: "bg-gradient-to-br from-green-500 to-emerald-600",
      iconColor: "text-white",
      textColor: "text-white",
      valueColor: "text-white",
      hoverEffect: "hover:from-green-400 hover:to-emerald-500 hover:shadow-2xl",
    },
    // Total Transactions
    {
      title: "Total Transactions",
      value: stats.total,
      icon: BarChart3,
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconColor: "text-white",
      textColor: "text-white",
      valueColor: "text-white",
      hoverEffect: "hover:from-blue-400 hover:to-blue-500 hover:shadow-2xl",
    },
    // Pending
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      bg: "bg-gradient-to-br from-yellow-500 to-amber-600",
      iconColor: "text-white",
      textColor: "text-white",
      valueColor: "text-white",
      hoverEffect: "hover:from-yellow-400 hover:to-amber-500 hover:shadow-2xl",
    },
    // Failed
    {
      title: "Failed",
      value: stats.failed,
      icon: AlertCircle,
      bg: "bg-gradient-to-br from-red-500 to-rose-600",
      iconColor: "text-white",
      textColor: "text-white",
      valueColor: "text-white",
      hoverEffect: "hover:from-red-400 hover:to-rose-500 hover:shadow-2xl",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards - Reordered with bold colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-500 transform hover:-translate-y-1 ${card.bg} ${card.hoverEffect}`}
            >
              {/* Card content */}
              <div className="relative p-6">
                {/* Icon and value row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-all duration-300">
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <span
                    className={`text-3xl font-bold ${card.valueColor} group-hover:scale-105 transition-transform`}
                  >
                    {card.value}
                  </span>
                </div>

                {/* Title */}
                <p
                  className={`text-sm font-medium ${card.textColor} opacity-90 group-hover:opacity-100 transition-opacity`}
                >
                  {card.title}
                </p>

                {/* Decorative shine effect */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters with visible inputs */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search phone, amount, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white text-gray-900"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white text-gray-900"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white text-gray-900"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={exportToCSV}
            className="flex items-center px-6 py-2.5 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-green-200 hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                  Checkout Request ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-green-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{format(payment.createdAt, "M/d/yyyy")}</div>
                      <div className="text-xs text-gray-500">
                        {formatRelativeTime(payment.createdAt)} ago
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatPhoneDisplay(payment.phoneNumber)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      KES {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {payment.transactionId || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {payment.checkoutRequestId || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 text-right">
        Showing {filteredPayments.length} of {payments?.length} transactions
      </div>
    </div>
  );
}
