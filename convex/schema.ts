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

export default defineSchema({
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
});
