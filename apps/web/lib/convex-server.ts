import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";

import type { CustomerMembershipRecord, CustomerRecord } from "./customers";

const listAccessibleCustomersRef = makeFunctionReference<"query", Record<string, never>, CustomerRecord[]>(
	"customers:listAccessibleCustomers",
);
const getCustomerByIdRef = makeFunctionReference<"query", { customerId: string }, CustomerRecord | null>(
	"customers:getCustomerById",
);
const listMembershipsForCustomerRef = makeFunctionReference<
	"query",
	{ customerId: string },
	CustomerMembershipRecord[]
>("memberships:listMembershipsForCustomer");
const createCustomerRef = makeFunctionReference<
	"mutation",
	{
		activeChannels: CustomerRecord["activeChannels"];
		clerkOrganizationId: string;
		currencyCode: string;
		name: string;
		slug: string;
	},
	string
>("customers:createCustomer");
const updateCustomerRef = makeFunctionReference<
	"mutation",
	{
		activeChannels: CustomerRecord["activeChannels"];
		clerkOrganizationId: string;
		currencyCode: string;
		customerId: string;
		name: string;
		slug: string;
		status: CustomerRecord["status"];
	},
	string
>("customers:updateCustomer");
const upsertMembershipRef = makeFunctionReference<
	"mutation",
	{
		clerkOrganizationId?: string;
		clerkUserId: string;
		customerId: string;
		role: CustomerMembershipRecord["role"];
	},
	string
>("memberships:upsertMembership");

export async function getConvexToken() {
	const authState = await auth();

	if (!authState.userId) {
		return null;
	}

	return authState.getToken({ template: "convex" });
}

export async function listAccessibleCustomers() {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listAccessibleCustomersRef, {}, { token });
}

export async function getCustomerById(customerId: string) {
	const token = await getConvexToken();

	if (!token) {
		return null;
	}

	return fetchQuery(getCustomerByIdRef, { customerId }, { token });
}

export async function listMembershipsForCustomer(customerId: string) {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listMembershipsForCustomerRef, { customerId }, { token });
}

export async function createCustomer(payload: {
	activeChannels: CustomerRecord["activeChannels"];
	clerkOrganizationId: string;
	currencyCode: string;
	name: string;
	slug: string;
}) {
	const token = await getConvexToken();
	if (!token) {
		throw new Error('Missing Clerk "convex" JWT token. Configure Clerk JWT template and sign in again.');
	}

	return fetchMutation(createCustomerRef, payload, { token });
}

export async function updateCustomer(payload: {
	activeChannels: CustomerRecord["activeChannels"];
	clerkOrganizationId: string;
	currencyCode: string;
	customerId: string;
	name: string;
	slug: string;
	status: CustomerRecord["status"];
}) {
	const token = await getConvexToken();
	if (!token) {
		throw new Error('Missing Clerk "convex" JWT token. Configure Clerk JWT template and sign in again.');
	}

	return fetchMutation(updateCustomerRef, payload, { token });
}

export async function upsertMembership(payload: {
	clerkOrganizationId?: string;
	clerkUserId: string;
	customerId: string;
	role: CustomerMembershipRecord["role"];
}) {
	const token = await getConvexToken();
	if (!token) {
		throw new Error('Missing Clerk "convex" JWT token. Configure Clerk JWT template and sign in again.');
	}

	return fetchMutation(upsertMembershipRef, payload, { token });
}
