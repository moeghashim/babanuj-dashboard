import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isAuthenticated } from "./auth-server";
import { getViewerContext, listAccessibleCustomers } from "./convex-server";

export const ACTIVE_CUSTOMER_COOKIE = "babanuj_active_customer";
export const APP_ROLES = ["platform_admin", "customer_viewer"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const CHANNELS = ["Website", "B2B", "Amazon", "TikTok", "Etsy", "Walmart", "Temu"] as const;
export type Channel = (typeof CHANNELS)[number];

function getAppRole(viewerContext: Awaited<ReturnType<typeof getViewerContext>> | null): AppRole | null {
	if (!viewerContext) {
		return null;
	}

	if (viewerContext.isPlatformAdmin) {
		return "platform_admin";
	}

	if (viewerContext.customerMemberships.some((membership) => membership.role === "customer_viewer")) {
		return "customer_viewer";
	}

	return null;
}

function resolveActiveCustomerId(candidateId: string | null, accessibleCustomerIds: string[]) {
	if (candidateId && accessibleCustomerIds.includes(candidateId)) {
		return candidateId;
	}

	if (accessibleCustomerIds.length === 1) {
		return accessibleCustomerIds[0];
	}

	return null;
}

export const getCurrentAppSession = cache(async () => {
	await headers();
	const signedIn = await isAuthenticated();
	const [viewerContext, accessibleCustomers] = signedIn
		? await Promise.all([getViewerContext(), listAccessibleCustomers()])
		: [null, []];
	const cookieStore = await cookies();
	const requestedCustomerId = cookieStore.get(ACTIVE_CUSTOMER_COOKIE)?.value ?? null;
	const accessibleCustomerIds = accessibleCustomers.map((customer) => customer._id);
	const activeCustomerId = resolveActiveCustomerId(requestedCustomerId, accessibleCustomerIds);
	const appRole = getAppRole(viewerContext);
	const user = viewerContext
		? {
				email: viewerContext.email,
				id: viewerContext.userId,
				name: viewerContext.name,
			}
		: null;

	return {
		activeCustomerId,
		appRole,
		accessibleCustomerIds,
		accessibleCustomers,
		isBootstrap: viewerContext?.isBootstrap ?? false,
		isPlatformAdmin: appRole === "platform_admin",
		isSignedIn: Boolean(user?.id),
		session: null,
		user,
		userId: user?.id ?? null,
		viewerContext,
	};
});

export async function requirePlatformAdmin() {
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
	}

	if (!session.isBootstrap && !session.isPlatformAdmin) {
		redirect("/unauthorized");
	}

	return session;
}

export async function requireCustomerAccess() {
	const session = await getCurrentAppSession();

	if (!session.userId) {
		redirect("/sign-in");
	}

	if (!session.activeCustomerId) {
		redirect("/select-org");
	}

	const hasCustomerMembership =
		session.isPlatformAdmin ||
		session.viewerContext?.customerMemberships.some(
			(membership) => membership.customerId === session.activeCustomerId && membership.role === "customer_viewer",
		);

	if (!hasCustomerMembership) {
		redirect("/unauthorized");
	}

	return session;
}
