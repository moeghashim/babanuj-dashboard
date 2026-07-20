import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import type { Preloaded } from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";

type EmptyObject = Record<string, never>;
type OptionalArgs<FuncRef extends FunctionReference<any, any>> = FuncRef["_args"] extends EmptyObject
	? [args?: EmptyObject]
	: [args: FuncRef["_args"]];

let authServer: ReturnType<typeof convexBetterAuthNextJs> | null = null;

function requireConvexUrl() {
	const value = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;

	if (!value) {
		throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured for Better Auth server helpers.");
	}

	return value;
}

function requireConvexSiteUrl() {
	const explicitValue = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

	if (explicitValue) {
		return explicitValue;
	}

	const convexUrl = requireConvexUrl();

	if (convexUrl.endsWith(".convex.cloud")) {
		return convexUrl.replace(".convex.cloud", ".convex.site");
	}

	throw new Error("CONVEX_SITE_URL is not configured for Better Auth server helpers.");
}

function getAuthServer() {
	authServer ??= convexBetterAuthNextJs({
		convexSiteUrl: requireConvexSiteUrl(),
		convexUrl: requireConvexUrl(),
	});

	return authServer;
}

export async function getToken() {
	return getAuthServer().getToken();
}

export async function isAuthenticated() {
	return getAuthServer().isAuthenticated();
}

export async function fetchAuthQuery<Query extends FunctionReference<"query">>(
	query: Query,
	...args: OptionalArgs<Query>
): Promise<FunctionReturnType<Query>> {
	return getAuthServer().fetchAuthQuery(query, ...(args as OptionalArgs<Query>));
}

export async function fetchAuthMutation<Mutation extends FunctionReference<"mutation">>(
	mutation: Mutation,
	...args: OptionalArgs<Mutation>
): Promise<FunctionReturnType<Mutation>> {
	return getAuthServer().fetchAuthMutation(mutation, ...(args as OptionalArgs<Mutation>));
}

export async function fetchAuthAction<Action extends FunctionReference<"action">>(
	action: Action,
	...args: OptionalArgs<Action>
): Promise<FunctionReturnType<Action>> {
	return getAuthServer().fetchAuthAction(action, ...(args as OptionalArgs<Action>));
}

export async function preloadAuthQuery<Query extends FunctionReference<"query">>(
	query: Query,
	...args: OptionalArgs<Query>
): Promise<Preloaded<Query>> {
	return getAuthServer().preloadAuthQuery(query, ...(args as OptionalArgs<Query>));
}

export async function handleAuthGet(request: Request) {
	return getAuthServer().handler.GET(request);
}

export async function handleAuthPost(request: Request) {
	return getAuthServer().handler.POST(request);
}
