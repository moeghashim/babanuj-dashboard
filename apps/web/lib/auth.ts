import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export const APP_ROLES = ["platform_admin", "customer_viewer"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const CHANNELS = ["Website", "B2B", "Amazon", "TikTok", "Etsy", "Walmart", "Temu"] as const;
export type Channel = (typeof CHANNELS)[number];

function isAppRole(value: unknown): value is AppRole {
	return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

function getMetadataRole(metadata: unknown): AppRole | null {
	if (!metadata || typeof metadata !== "object") {
		return null;
	}

	const appRole = (metadata as { appRole?: unknown }).appRole;
	return isAppRole(appRole) ? appRole : null;
}

export const getCurrentAppSession = cache(async () => {
	const authState = await auth();
	const user = authState.userId ? await currentUser() : null;
	const appRole = getMetadataRole(user?.publicMetadata);

	return {
		appRole,
		isPlatformAdmin: appRole === "platform_admin",
		isSignedIn: Boolean(authState.userId),
		orgId: authState.orgId ?? null,
		orgRole: authState.orgRole ?? null,
		user,
		userId: authState.userId ?? null,
	};
});

export async function requirePlatformAdmin() {
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
	}

	if (!session.isPlatformAdmin) {
		redirect("/unauthorized");
	}

	return session;
}

export async function requireCustomerAccess() {
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
	}

	if (!session.orgId) {
		redirect("/select-org");
	}

	if (!session.isPlatformAdmin && session.appRole !== "customer_viewer") {
		redirect("/unauthorized");
	}

	return session;
}
