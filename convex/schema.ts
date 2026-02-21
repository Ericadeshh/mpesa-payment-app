import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  payments: defineTable({
    amount: v.number(),
    phoneNumber: v.string(),
    transactionId: v.optional(v.string()),
    checkoutRequestId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_phone", ["phoneNumber"])
    .index("by_status", ["status"])
    .index("by_checkoutRequestId", ["checkoutRequestId"]),
});
