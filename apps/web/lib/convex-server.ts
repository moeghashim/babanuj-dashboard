import { fetchQuery } from "convex/nextjs";
import { makeFunctionReference } from "convex/server";

import { fetchAuthMutation, fetchAuthQuery } from "./auth-server";
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

function getConvexDeploymentUrl() {
	const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;

	if (!deploymentUrl) {
		throw new Error("Convex deployment URL is not configured.");
	}

	return deploymentUrl;
}

export async function getViewerContext() {
	return fetchAuthQuery(viewerContextRef, {});
}

export async function listAccessibleCustomers() {
	return fetchAuthQuery(listAccessibleCustomersRef, {});
}

export async function getCustomerById(customerId: string) {
	return fetchAuthQuery(getCustomerByIdRef, { customerId });
}

export async function listMembershipsForCustomer(customerId: string) {
	return fetchAuthQuery(listMembershipsForCustomerRef, { customerId });
}

export async function listInvitesForCustomer(customerId: string) {
	return fetchAuthQuery(listInvitesForCustomerRef, { customerId });
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
	return fetchAuthMutation(createCustomerRef, payload);
}

export async function listReportingPeriods(customerId?: string) {
	return fetchAuthQuery(listReportingPeriodsRef, customerId ? { customerId } : {});
}

export async function updateCustomer(payload: {
	activeChannels: CustomerRecord["activeChannels"];
	currencyCode: string;
	customerId: string;
	name: string;
	slug: string;
	status: CustomerRecord["status"];
}) {
	return fetchAuthMutation(updateCustomerRef, payload);
}

export async function upsertMembership(payload: {
	authUserId: string;
	customerId: string;
	role: CustomerMembershipRecord["role"];
	userEmail: string;
	userName?: string;
}) {
	return fetchAuthMutation(upsertMembershipRef, payload);
}

export async function createCustomerInvite(payload: {
	customerId: string;
	email: string;
	expiresAt: number;
	role: CustomerMembershipRecord["role"];
}) {
	return fetchAuthMutation(createCustomerInviteRef, payload);
}

export async function acceptCustomerInvite(tokenValue: string) {
	return fetchAuthMutation(acceptCustomerInviteRef, { token: tokenValue });
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
	return fetchAuthMutation(upsertChannelMetricRef, payload);
}

export async function getAdminPerformanceOverview(periodKey?: string) {
	return fetchAuthQuery(getAdminPerformanceOverviewRef, periodKey ? { periodKey } : {});
}

export async function listAdminMetricsForPeriod(periodKey?: string) {
	return fetchAuthQuery(listAdminMetricsForPeriodRef, periodKey ? { periodKey } : {});
}

export async function getCustomerPerformanceOverview(customerId: string, periodKey?: string) {
	return fetchAuthQuery(getCustomerPerformanceOverviewRef, periodKey ? { customerId, periodKey } : { customerId });
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
	return fetchAuthMutation(createInvoiceRef, payload);
}

export async function getAdminFinanceOverview(customerId?: string) {
	return fetchAuthQuery(getAdminFinanceOverviewRef, customerId ? { customerId } : {});
}

export async function getCustomerFinanceOverview(customerId: string) {
	return fetchAuthQuery(getCustomerFinanceOverviewRef, { customerId });
}

export async function createPayment(payload: {
	amount: number;
	invoiceId: string;
	note?: string;
	paymentDate: number;
	reference?: string;
}) {
	return fetchAuthMutation(createPaymentRef, payload);
}
