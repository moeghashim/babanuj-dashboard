import { fetchMutation, fetchQuery } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";
import { headers } from "next/headers";

import { auth } from "./auth-config";
import type {
	CustomerInviteDetailRecord,
	CustomerInviteRecord,
	CustomerMembershipRecord,
	CustomerRecord,
} from "./customers";
import type { AdminFinanceOverview, CustomerFinanceOverview, InvoiceRecord } from "./finance";
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
const listInvitesForCustomerRef = makeFunctionReference<"query", { customerId: string }, CustomerInviteRecord[]>(
	"customerInvites:listInvitesForCustomer",
);
const getInviteByTokenRef = makeFunctionReference<"query", { token: string }, CustomerInviteDetailRecord | null>(
	"customerInvites:getInviteByToken",
);
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
const createCustomerInviteRef = makeFunctionReference<
	"mutation",
	{
		customerId: string;
		email: string;
		expiresAt: number;
		role: CustomerMembershipRecord["role"];
	},
	string
>("customerInvites:createCustomerInvite");
const acceptCustomerInviteRef = makeFunctionReference<"mutation", { token: string }, string>(
	"customerInvites:acceptCustomerInvite",
);
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
const createInvoiceRef = makeFunctionReference<
	"mutation",
	{
		amount: number;
		customerId: string;
		dueDate: number;
		invoiceNumber: string;
		issuedDate: number;
		lifecycleStatus: InvoiceRecord["lifecycleStatus"];
		note?: string;
	},
	string
>("invoices:createInvoice");
const getAdminFinanceOverviewRef = makeFunctionReference<"query", { customerId?: string }, AdminFinanceOverview>(
	"invoices:getAdminFinanceOverview",
);
const getCustomerFinanceOverviewRef = makeFunctionReference<"query", { customerId: string }, CustomerFinanceOverview>(
	"invoices:getCustomerFinanceOverview",
);
const createPaymentRef = makeFunctionReference<
	"mutation",
	{
		amount: number;
		invoiceId: string;
		note?: string;
		paymentDate: number;
		reference?: string;
	},
	string
>("payments:createPayment");

export async function getConvexToken() {
	const requestHeaders = await headers();
	const cookieHeader = requestHeaders.get("cookie");

	if (cookieHeader) {
		try {
			const tokenResponse = await fetch(`${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/token`, {
				cache: "no-store",
				headers: {
					cookie: cookieHeader,
				},
			});

			if (tokenResponse.ok) {
				const payload = (await tokenResponse.json()) as { token?: string };
				if (typeof payload.token === "string") {
					return payload.token;
				}
			}
		} catch {
			// Fall through to the in-process Better Auth helper.
		}
	}

	try {
		const tokenResponse = await auth.api.getToken({
			headers: requestHeaders,
		});

		return tokenResponse.token;
	} catch {
		return null;
	}
}

function getConvexDeploymentUrl() {
	const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;

	if (!deploymentUrl) {
		throw new Error("Convex deployment URL is not configured.");
	}

	return deploymentUrl;
}

export async function getViewerContext() {
	const token = await getConvexToken();

	if (!token) {
		return null;
	}

	return fetchQuery(viewerContextRef, {}, { token, url: getConvexDeploymentUrl() });
}

export async function listAccessibleCustomers() {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listAccessibleCustomersRef, {}, { token, url: getConvexDeploymentUrl() });
}

export async function getCustomerById(customerId: string) {
	const token = await getConvexToken();

	if (!token) {
		return null;
	}

	return fetchQuery(getCustomerByIdRef, { customerId }, { token, url: getConvexDeploymentUrl() });
}

export async function listMembershipsForCustomer(customerId: string) {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listMembershipsForCustomerRef, { customerId }, { token, url: getConvexDeploymentUrl() });
}

export async function listInvitesForCustomer(customerId: string) {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listInvitesForCustomerRef, { customerId }, { token, url: getConvexDeploymentUrl() });
}

export async function getInviteByToken(token: string) {
	return fetchQuery(getInviteByTokenRef, { token }, { url: getConvexDeploymentUrl() });
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

	return fetchMutation(createCustomerRef, payload, { token, url: getConvexDeploymentUrl() });
}

export async function listReportingPeriods(customerId?: string) {
	const token = await getConvexToken();

	if (!token) {
		return [];
	}

	return fetchQuery(listReportingPeriodsRef, customerId ? { customerId } : {}, {
		token,
		url: getConvexDeploymentUrl(),
	});
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

	return fetchMutation(updateCustomerRef, payload, { token, url: getConvexDeploymentUrl() });
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

	return fetchMutation(upsertMembershipRef, payload, { token, url: getConvexDeploymentUrl() });
}

export async function createCustomerInvite(payload: {
	customerId: string;
	email: string;
	expiresAt: number;
	role: CustomerMembershipRecord["role"];
}) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the invite update.");
	}

	return fetchMutation(createCustomerInviteRef, payload, { token, url: getConvexDeploymentUrl() });
}

export async function acceptCustomerInvite(tokenValue: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the invite acceptance.");
	}

	return fetchMutation(acceptCustomerInviteRef, { token: tokenValue }, { token, url: getConvexDeploymentUrl() });
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

	return fetchMutation(upsertChannelMetricRef, payload, { token, url: getConvexDeploymentUrl() });
}

export async function getAdminPerformanceOverview(periodKey?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the dashboard request.");
	}

	return fetchQuery(getAdminPerformanceOverviewRef, periodKey ? { periodKey } : {}, {
		token,
		url: getConvexDeploymentUrl(),
	});
}

export async function listAdminMetricsForPeriod(periodKey?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the dashboard request.");
	}

	return fetchQuery(listAdminMetricsForPeriodRef, periodKey ? { periodKey } : {}, {
		token,
		url: getConvexDeploymentUrl(),
	});
}

export async function getCustomerPerformanceOverview(customerId: string, periodKey?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the dashboard request.");
	}

	return fetchQuery(getCustomerPerformanceOverviewRef, periodKey ? { customerId, periodKey } : { customerId }, {
		token,
		url: getConvexDeploymentUrl(),
	});
}

export async function createInvoice(payload: {
	amount: number;
	customerId: string;
	dueDate: number;
	invoiceNumber: string;
	issuedDate: number;
	lifecycleStatus: InvoiceRecord["lifecycleStatus"];
	note?: string;
}) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the invoice update.");
	}

	return fetchMutation(createInvoiceRef, payload, { token, url: getConvexDeploymentUrl() });
}

export async function getAdminFinanceOverview(customerId?: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the finance request.");
	}

	return fetchQuery(getAdminFinanceOverviewRef, customerId ? { customerId } : {}, {
		token,
		url: getConvexDeploymentUrl(),
	});
}

export async function getCustomerFinanceOverview(customerId: string) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the finance request.");
	}

	return fetchQuery(getCustomerFinanceOverviewRef, { customerId }, { token, url: getConvexDeploymentUrl() });
}

export async function createPayment(payload: {
	amount: number;
	invoiceId: string;
	note?: string;
	paymentDate: number;
	reference?: string;
}) {
	const token = await getConvexToken();

	if (!token) {
		throw new Error("Missing Better Auth JWT token. Sign in again and retry the payment update.");
	}

	return fetchMutation(createPaymentRef, payload, { token, url: getConvexDeploymentUrl() });
}
