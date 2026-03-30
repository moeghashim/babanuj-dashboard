import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

import { getViewerMemberships, requireIdentity, requirePlatformAdminMembership } from "./auth";

export const listMembershipsForCustomer = queryGeneric({
	args: {
		customerId: v.id("customers"),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const memberships = await getViewerMemberships(ctx, identity.subject);
		const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");

		if (!isPlatformAdmin) {
			return [];
		}

		return ctx.db
			.query("customerMemberships")
			.withIndex("by_customer_id", (query) => query.eq("customerId", args.customerId))
			.collect();
	},
});

export const upsertMembership = mutationGeneric({
	args: {
		clerkOrganizationId: v.optional(v.string()),
		clerkUserId: v.string(),
		customerId: v.id("customers"),
		role: v.union(v.literal("platform_admin"), v.literal("customer_viewer")),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);

		const existing = await ctx.db
			.query("customerMemberships")
			.withIndex("by_user_and_customer", (query) =>
				query.eq("clerkUserId", args.clerkUserId).eq("customerId", args.customerId),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				clerkOrganizationId: args.clerkOrganizationId,
				role: args.role,
			});
			return existing._id;
		}

		return ctx.db.insert("customerMemberships", args);
	},
});
