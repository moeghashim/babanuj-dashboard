import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

import { requireIdentity, requirePlatformAdminMembership } from "./auth";

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
