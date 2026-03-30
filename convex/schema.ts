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
		clerkOrganizationId: v.optional(v.string()),
		clerkUserId: v.string(),
		customerId: v.id("customers"),
		role: appRoleValidator,
	})
		.index("by_clerk_user_id", ["clerkUserId"])
		.index("by_customer_id", ["customerId"])
		.index("by_user_and_customer", ["clerkUserId", "customerId"]),

	customers: defineTable({
		activeChannels: v.array(channelValidator),
		clerkOrganizationId: v.string(),
		createdAt: v.number(),
		createdBy: v.string(),
		currencyCode: v.string(),
		name: v.string(),
		slug: v.string(),
		status: v.union(v.literal("active"), v.literal("inactive")),
		updatedAt: v.number(),
		updatedBy: v.string(),
	})
		.index("by_clerk_organization_id", ["clerkOrganizationId"])
		.index("by_slug", ["slug"]),
});
