import { ConvexError } from "convex/values";

import type { GenericQueryCtx } from "convex/server";

export async function requireIdentity(ctx: GenericQueryCtx<any>) {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		throw new ConvexError("Authentication required");
	}

	return identity;
}

export async function getViewerMemberships(ctx: GenericQueryCtx<any>, authUserId: string) {
	return ctx.db.query("customerMemberships").withIndex("by_auth_user_id", (query) => query.eq("authUserId", authUserId)).collect();
}

export async function requirePlatformAdminMembership(ctx: GenericQueryCtx<any>, authUserId: string) {
	const memberships = await getViewerMemberships(ctx, authUserId);
	const adminMembership = memberships.find((membership) => membership.role === "platform_admin");

	if (adminMembership) {
		return adminMembership;
	}

	const existingMemberships = await ctx.db.query("customerMemberships").collect();

	if (existingMemberships.length === 0) {
		return null;
	}

	throw new ConvexError("Platform admin access required");
}
