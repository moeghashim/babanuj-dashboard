import { fetchMutation, fetchQuery } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";
import { headers } from "next/headers";

import { auth } from "./auth-config";
import type { CustomerMembershipRecord, CustomerRecord } from "./customers";
import type {
	AdminMetricRecord,
	AdminPerformanceOverview,
	CustomerPerformanceOverview,
	ReportingPeriodRecord,
} from "./performance";

type ViewerContextRecord = {
	accessibleCustomerIds: string[];
	customerMemberships: CustomerMembershipRecord[];
	email: string | null;
	isBootstrap: boolean;
	isPlatformAdmin: boolean;
	name: string | null;
	userId: string;
};

const viewerContextRef = makeFunctionReference<"query", Record<string, never>, ViewerContextRecord>(
	"customers:viewerContext",
);
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
		authUserId: string;
		customerId: string;
		role: CustomerMembershipRecord["role"];
		userEmail: string;
		userName?: string;
	},
	string
>("memberships:upsertMembership");
const listReportingPeriodsRef = makeFunctionReference<"query", { customerId?: string }, ReportingPeriodRecord[]>(
	"reportingPeriods:listReportingPeriods",
);
const upsertChannelMetricRef = makeFunctionReference<
	"mutation",
	{
		channel: CustomerRecord["activeChannels"][number];
		customerId: string;
		grossRevenue: number;
		orderCount: number;
		periodKey: string;
		source: "manual" | "integration";
		sourceReference?: string;
	},
	string
>("channelMetrics:upsertChannelMetric");
const getAdminPerformanceOverviewRef = makeFunctionReference<"query", { periodKey?: string }, AdminPerformanceOverview>(
	"channelMetrics:getAdminPerformanceOverview",
);
const listAdminMetricsForPeriodRef = makeFunctionReference<
	"query",
	{ periodKey?: string },
	{
		availablePeriods: ReportingPeriodRecord[];
		metrics: AdminMetricRecord[];
		selectedPeriod: ReportingPeriodRecord | null;
	}
>("channelMetrics:listAdminMetricsForPeriod");
const getCustomerPerformanceOverviewRef = makeFunctionReference<
	"query",
	{ customerId: string; periodKey?: string },
	CustomerPerformanceOverview
>("channelMetrics:getCustomerPerformanceOverview");

export async function getConvexToken() {
	try {
		const tokenResponse = await auth.api.getToken({
			headers: await headers(),
		});

		return tokenResponse.token;
	} catch {
		return null;
	}
}

export async function getViewerContext() {
	const token = await getConvexToken();

	if (!token) {
		return null;
	}

	return fetchQuery(viewerContextRef, {}, { token });
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
	currencyCode: string;
	name: string;
	slug: string;
}) {
	const token = await getConvexToken();
	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the customer update.");
	}

	return fetchMutation(createCustomerRef, payload, { token });
}

export async function listReportingPeriods(customerId?: string) {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listReportingPeriodsRef, customerId ? { customerId } : {}, { token });
}

export async function updateCustomer(payload: {
	activeChannels: CustomerRecord["activeChannels"];
	currencyCode: string;
	customerId: string;
	name: string;
	slug: string;
	status: CustomerRecord["status"];
}) {
	const token = await getConvexToken();
	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the customer update.");
	}

	return fetchMutation(updateCustomerRef, payload, { token });
}

export async function upsertMembership(payload: {
	authUserId: string;
	customerId: string;
	role: CustomerMembershipRecord["role"];
	userEmail: string;
	userName?: string;
}) {
	const token = await getConvexToken();
	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the membership update.");
	}

	return fetchMutation(upsertMembershipRef, payload, { token });
}

export async function upsertChannelMetric(payload: {
	channel: CustomerRecord["activeChannels"][number];
	customerId: string;
	grossRevenue: number;
	orderCount: number;
	periodKey: string;
	source: "manual" | "integration";
	sourceReference?: string;
}) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the performance update.");
	}

	return fetchMutation(upsertChannelMetricRef, payload, { token });
}

export async function getAdminPerformanceOverview(periodKey?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the dashboard request.");
	}

	return fetchQuery(getAdminPerformanceOverviewRef, periodKey ? { periodKey } : {}, { token });
}

export async function listAdminMetricsForPeriod(periodKey?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the dashboard request.");
	}

	return fetchQuery(listAdminMetricsForPeriodRef, periodKey ? { periodKey } : {}, { token });
}

export async function getCustomerPerformanceOverview(customerId: string, periodKey?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the dashboard request.");
	}

	return fetchQuery(getCustomerPerformanceOverviewRef, periodKey ? { customerId, periodKey } : { customerId }, {
		token,
	});
}
