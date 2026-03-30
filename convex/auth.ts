import { ConvexError } from "convex/values";

import type { GenericQueryCtx } from "convex/server";

export async function requireIdentity(ctx: GenericQueryCtx<any>) {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) {
		throw new ConvexError("Authentication required");
	}

	return identity;
}

export async function getViewerMemberships(ctx: GenericQueryCtx<any>, clerkUserId: string) {
	return ctx.db.query("customerMemberships").withIndex("by_clerk_user_id", (query) => query.eq("clerkUserId", clerkUserId)).collect();
}

export async function requirePlatformAdminMembership(ctx: GenericQueryCtx<any>, clerkUserId: string) {
	const memberships = await getViewerMemberships(ctx, clerkUserId);
	const adminMembership = memberships.find((membership) => membership.role === "platform_admin");

	if (!adminMembership) {
		throw new ConvexError("Platform admin access required");
	}

	return adminMembership;
}
