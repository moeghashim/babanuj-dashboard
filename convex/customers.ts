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
		const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");
		const accessibleCustomers = isPlatformAdmin
			? await ctx.db.query("customers").collect()
			: (await Promise.all(memberships.map((membership) => ctx.db.get(membership.customerId)))).filter(
					(customer) => customer !== null,
				);
		const membershipCount = (await ctx.db.query("customerMemberships").collect()).length;

		return {
			accessibleCustomerIds: accessibleCustomers.map((customer) => customer._id),
			customerMemberships: memberships,
			email: identity.email ?? null,
			isBootstrap: membershipCount === 0,
			isPlatformAdmin,
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
			createdAt: now,
			createdBy: identity.subject,
			currencyCode: args.currencyCode,
			name: args.name,
			slug: args.slug,
			status: "active",
			updatedAt: now,
			updatedBy: identity.subject,
		});

		const existingMembership = (await getViewerMemberships(ctx, identity.subject)).find(
			(membership) => membership.customerId === customerId,
		);

		if (!existingMembership) {
			await ctx.db.insert("customerMemberships", {
				authUserId: identity.subject,
				customerId,
				role: "platform_admin",
				userEmail: identity.email ?? "unknown@example.com",
				userName: identity.name ?? undefined,
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
