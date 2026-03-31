import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

type AuthContext = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

type BetterAuthUserRecord = {
	_id: string;
	email: string;
	name: string;
};

const betterAuthBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.SITE_URL ?? "http://localhost:3000";
const betterAuthSecret = process.env.BETTER_AUTH_SECRET ?? "babanuj-dashboard-dev-secret-change-me";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	betterAuth({
		baseURL: betterAuthBaseUrl,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			autoSignIn: true,
			enabled: true,
			minPasswordLength: 8,
		},
		plugins: [
			convex({
				authConfig,
				options: {
					basePath: "/api/auth",
				},
			}),
		],
		secret: betterAuthSecret,
	});

export async function requireIdentity(ctx: AuthContext) {
	const authUser = await authComponent.safeGetAuthUser(ctx);

	if (!authUser) {
		throw new ConvexError("Authentication required");
	}

	return {
		email: authUser.email,
		name: authUser.name,
		subject: authUser._id,
	};
}

export async function getViewerMemberships(ctx: AuthContext, authUserId: string) {
	return ctx.db.query("customerMemberships").withIndex("by_auth_user_id", (query) => query.eq("authUserId", authUserId)).collect();
}

export async function requirePlatformAdminMembership(ctx: AuthContext, authUserId: string) {
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

export const getAuthUserByEmail = queryGeneric({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);
		const normalizedEmail = args.email.trim().toLowerCase();
		const authUser = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "email", value: normalizedEmail }],
		})) as BetterAuthUserRecord | null;

		if (!authUser) {
			return null;
		}

		return {
			email: authUser.email,
			id: authUser._id,
			name: authUser.name,
		};
	},
});
