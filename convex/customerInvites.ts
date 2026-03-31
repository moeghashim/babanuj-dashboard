import { mutationGeneric, queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";

import { getViewerMemberships, requireIdentity, requirePlatformAdminMembership } from "./auth";

const inviteRoleValidator = v.union(v.literal("platform_admin"), v.literal("customer_viewer"));

export const listInvitesForCustomer = queryGeneric({
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

		const invites = await ctx.db
			.query("customerInvites")
			.withIndex("by_customer_id", (query) => query.eq("customerId", args.customerId))
			.collect();

		return invites.sort((left, right) => right.createdAt - left.createdAt);
	},
});

export const getInviteByToken = queryGeneric({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const invite = await ctx.db
			.query("customerInvites")
			.withIndex("by_token", (query) => query.eq("token", args.token))
			.unique();

		if (!invite) {
			return null;
		}

		const customer = await ctx.db.get(invite.customerId);

		if (!customer) {
			return null;
		}

		const now = Date.now();
		const isExpired = invite.expiresAt < now;

		return {
			...invite,
			customerName: customer.name,
			isExpired,
			isValid: invite.status === "pending" && !isExpired,
		};
	},
});

export const createCustomerInvite = mutationGeneric({
	args: {
		customerId: v.id("customers"),
		email: v.string(),
		expiresAt: v.number(),
		role: inviteRoleValidator,
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);
		const customer = await ctx.db.get(args.customerId);

		if (!customer) {
			throw new ConvexError("Customer not found");
		}

		if (args.expiresAt <= Date.now()) {
			throw new ConvexError("Invite expiry must be in the future");
		}

		const normalizedEmail = args.email.trim().toLowerCase();
		const now = Date.now();
		const existingInvite = (
			await ctx.db
				.query("customerInvites")
				.withIndex("by_customer_id", (query) => query.eq("customerId", args.customerId))
				.collect()
		).find((invite) => invite.email === normalizedEmail && invite.status === "pending");

		const nextInvite = {
			email: normalizedEmail,
			expiresAt: args.expiresAt,
			role: args.role,
			status: "pending" as const,
			token: crypto.randomUUID(),
			updatedAt: now,
			updatedBy: identity.subject,
		};

		if (existingInvite) {
			await ctx.db.patch(existingInvite._id, nextInvite);
			return existingInvite._id;
		}

		return ctx.db.insert("customerInvites", {
			acceptedAt: undefined,
			acceptedBy: undefined,
			createdAt: now,
			createdBy: identity.subject,
			customerId: args.customerId,
			...nextInvite,
		});
	},
});

export const acceptCustomerInvite = mutationGeneric({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const invite = await ctx.db
			.query("customerInvites")
			.withIndex("by_token", (query) => query.eq("token", args.token))
			.unique();

		if (!invite) {
			throw new ConvexError("Invite not found");
		}

		if (invite.status !== "pending") {
			throw new ConvexError("Invite is no longer active");
		}

		if (invite.expiresAt < Date.now()) {
			throw new ConvexError("Invite has expired");
		}

		if (!identity.email || identity.email.trim().toLowerCase() !== invite.email) {
			throw new ConvexError("Invite email does not match the signed-in account");
		}

		const existingMembership = (
			await ctx.db
				.query("customerMemberships")
				.withIndex("by_auth_user_id", (query) => query.eq("authUserId", identity.subject))
				.collect()
		).find((membership) => membership.customerId === invite.customerId);

		if (existingMembership) {
			await ctx.db.patch(existingMembership._id, {
				role: invite.role,
				userEmail: invite.email,
				userName: identity.name ?? undefined,
			});
		} else {
			await ctx.db.insert("customerMemberships", {
				authUserId: identity.subject,
				customerId: invite.customerId,
				role: invite.role,
				userEmail: invite.email,
				userName: identity.name ?? undefined,
			});
		}

		await ctx.db.patch(invite._id, {
			acceptedAt: Date.now(),
			acceptedBy: identity.subject,
			status: "accepted",
			updatedAt: Date.now(),
			updatedBy: identity.subject,
		});

		return invite.customerId;
	},
});
