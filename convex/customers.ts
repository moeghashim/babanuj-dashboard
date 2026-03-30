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
		const customerId = await ctx.db.insert("customers", {
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

		const existingMembership = await ctx.db
			.query("customerMemberships")
			.withIndex("by_user_and_customer", (query) =>
				query.eq("clerkUserId", identity.subject).eq("customerId", customerId),
			)
			.first();

		if (!existingMembership) {
			await ctx.db.insert("customerMemberships", {
				clerkOrganizationId: args.clerkOrganizationId,
				clerkUserId: identity.subject,
				customerId,
				role: "platform_admin",
			});
		}

		return customerId;
	},
});

export const getCustomerById = queryGeneric({
	args: {
		customerId: v.id("customers"),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const memberships = await getViewerMemberships(ctx, identity.subject);
		const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");

		if (isPlatformAdmin) {
			return ctx.db.get(args.customerId);
		}

		const hasAccess = memberships.some((membership) => membership.customerId === args.customerId);
		if (!hasAccess) {
			return null;
		}

		return ctx.db.get(args.customerId);
	},
});

export const updateCustomer = mutationGeneric({
	args: {
		activeChannels: channelArrayValidator,
		clerkOrganizationId: v.string(),
		currencyCode: v.string(),
		customerId: v.id("customers"),
		name: v.string(),
		slug: v.string(),
		status: v.union(v.literal("active"), v.literal("inactive")),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);

		await ctx.db.patch(args.customerId, {
			activeChannels: args.activeChannels,
			clerkOrganizationId: args.clerkOrganizationId,
			currencyCode: args.currencyCode,
			name: args.name,
			slug: args.slug,
			status: args.status,
			updatedAt: Date.now(),
			updatedBy: identity.subject,
		});

		return args.customerId;
	},
});
