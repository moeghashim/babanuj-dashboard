import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const channelValidator = v.union(
	v.literal("Website"),
	v.literal("B2B"),
	v.literal("Amazon"),
	v.literal("TikTok"),
	v.literal("Etsy"),
	v.literal("Walmart"),
	v.literal("Temu"),
);

const appRoleValidator = v.union(v.literal("platform_admin"), v.literal("customer_viewer"));
const recordSourceValidator = v.union(v.literal("manual"), v.literal("integration"));

export default defineSchema({
	channelMetrics: defineTable({
		averageOrderValue: v.number(),
		channel: channelValidator,
		createdAt: v.number(),
		createdBy: v.string(),
		customerId: v.id("customers"),
		grossRevenue: v.number(),
		orderCount: v.number(),
		periodId: v.id("reportingPeriods"),
		periodKey: v.string(),
		source: recordSourceValidator,
		sourceReference: v.optional(v.string()),
		updatedAt: v.number(),
		updatedBy: v.string(),
	})
		.index("by_customer_period", ["customerId", "periodKey"])
		.index("by_customer_period_channel", ["customerId", "periodKey", "channel"])
		.index("by_period", ["periodKey"]),

	customerMemberships: defineTable({
		authUserId: v.string(),
		customerId: v.id("customers"),
		role: appRoleValidator,
		userEmail: v.string(),
		userName: v.optional(v.string()),
	})
		.index("by_auth_user_id", ["authUserId"])
		.index("by_customer_id", ["customerId"])
		.index("by_user_and_customer", ["authUserId", "customerId"]),

	customers: defineTable({
		activeChannels: v.array(channelValidator),
		createdAt: v.number(),
		createdBy: v.string(),
		currencyCode: v.string(),
		name: v.string(),
		slug: v.string(),
		status: v.union(v.literal("active"), v.literal("inactive")),
		updatedAt: v.number(),
		updatedBy: v.string(),
	})
		.index("by_slug", ["slug"]),

	reportingPeriods: defineTable({
		createdAt: v.number(),
		label: v.string(),
		month: v.number(),
		periodKey: v.string(),
		year: v.number(),
	})
		.index("by_period_key", ["periodKey"]),
});
