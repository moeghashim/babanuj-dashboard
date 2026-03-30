import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

import { getViewerMemberships, requireIdentity, requirePlatformAdminMembership } from "./auth";

const channelArrayValidator = v.array(
	v.union(
		v.literal("Website"),
		v.literal("B2B"),
		v.literal("Amazon"),
		v.literal("TikTok"),
		v.literal("Etsy"),
		v.literal("Walmart"),
		v.literal("Temu"),
	),
);

export const viewerContext = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx);
		const memberships = await getViewerMemberships(ctx, identity.subject);

		return {
			customerMemberships: memberships,
			email: identity.email ?? null,
			name: identity.name ?? null,
			userId: identity.subject,
		};
	},
});

export const listAccessibleCustomers = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx);
		const memberships = await getViewerMemberships(ctx, identity.subject);
		const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");

		if (isPlatformAdmin) {
			return ctx.db.query("customers").collect();
		}

		const customers = await Promise.all(memberships.map((membership) => ctx.db.get(membership.customerId)));
		return customers.filter((customer) => customer !== null);
	},
});

export const createCustomer = mutationGeneric({
	args: {
		activeChannels: channelArrayValidator,
		clerkOrganizationId: v.string(),
		currencyCode: v.string(),
		name: v.string(),
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);
		const now = Date.now();

		return ctx.db.insert("customers", {
			activeChannels: args.activeChannels,
			clerkOrganizationId: args.clerkOrganizationId,
			createdAt: now,
			createdBy: identity.subject,
			currencyCode: args.currencyCode,
			name: args.name,
			slug: args.slug,
			status: "active",
			updatedAt: now,
			updatedBy: identity.subject,
		});
	},
});
