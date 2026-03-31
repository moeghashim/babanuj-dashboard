import { ConvexError, v } from "convex/values";
import { mutationGeneric, queryGeneric } from "convex/server";

import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

import { getViewerMemberships, requireIdentity, requirePlatformAdminMembership } from "./auth";
import type { DataModel, Doc, Id } from "./_generated/dataModel.js";

const channelValidator = v.union(
	v.literal("Website"),
	v.literal("B2B"),
	v.literal("Amazon"),
	v.literal("TikTok"),
	v.literal("Etsy"),
	v.literal("Walmart"),
	v.literal("Temu"),
);

const recordSourceValidator = v.union(v.literal("manual"), v.literal("integration"));

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;
type CustomerDoc = Doc<"customers">;
type ChannelMetricDoc = Doc<"channelMetrics">;
type ReportingPeriodDoc = Doc<"reportingPeriods">;

type GroupSummary = {
	averageOrderValue: number;
	customerCount: number;
	grossRevenue: number;
	growthPercent: number | null;
	key: string;
	label: string;
	orderCount: number;
};

function comparePeriodKeysDescending(left: string, right: string) {
	return right.localeCompare(left);
}

function deriveAverageOrderValue(grossRevenue: number, orderCount: number) {
	return orderCount > 0 ? Number((grossRevenue / orderCount).toFixed(2)) : 0;
}

function deriveGrowthPercent(currentValue: number, previousValue: number) {
	if (previousValue <= 0) {
		return currentValue > 0 ? 100 : null;
	}

	return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
}

function formatPeriodLabel(periodKey: string) {
	const [yearText, monthText] = periodKey.split("-");
	const year = Number(yearText);
	const monthIndex = Number(monthText) - 1;

	if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
		throw new ConvexError("Reporting period must use YYYY-MM format");
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
	}).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function parsePeriodKey(periodKey: string) {
	if (!/^\d{4}-\d{2}$/.test(periodKey)) {
		throw new ConvexError("Reporting period must use YYYY-MM format");
	}

	const [yearText, monthText] = periodKey.split("-");
	const year = Number(yearText);
	const month = Number(monthText);

	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw new ConvexError("Reporting period must use YYYY-MM format");
	}

	return {
		label: formatPeriodLabel(periodKey),
		month,
		periodKey,
		year,
	};
}

async function ensureReportingPeriod(
	ctx: MutationCtx,
	periodKey: string,
) {
	const normalizedPeriod = parsePeriodKey(periodKey);
	const existingPeriod = await ctx.db
		.query("reportingPeriods")
		.withIndex("by_period_key", (query) => query.eq("periodKey", normalizedPeriod.periodKey))
		.unique();

	if (existingPeriod) {
		return existingPeriod;
	}

	const periodId = await ctx.db.insert("reportingPeriods", {
		createdAt: Date.now(),
		label: normalizedPeriod.label,
		month: normalizedPeriod.month,
		periodKey: normalizedPeriod.periodKey,
		year: normalizedPeriod.year,
	});

	const insertedPeriod = await ctx.db.get(periodId);

	if (!insertedPeriod) {
		throw new ConvexError("Unable to create reporting period");
	}

	return insertedPeriod;
}

async function getAccessibleCustomerIds(ctx: QueryCtx, authUserId: string) {
	const memberships = await getViewerMemberships(ctx, authUserId);
	const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");
	const customers = isPlatformAdmin ? await ctx.db.query("customers").collect() : [];

	return {
		isPlatformAdmin,
		memberships,
		customerIds: isPlatformAdmin
			? customers.map((customer: CustomerDoc) => customer._id)
			: memberships.map((membership) => membership.customerId),
	};
}

async function requireCustomerAccess(
	ctx: QueryCtx,
	authUserId: string,
	customerId: Id<"customers">,
) {
	const { isPlatformAdmin, memberships } = await getAccessibleCustomerIds(ctx, authUserId);

	if (isPlatformAdmin) {
		return;
	}

	const hasAccess = memberships.some((membership) => membership.customerId === customerId);

	if (!hasAccess) {
		throw new ConvexError("Customer access required");
	}
}

async function listPeriodsForCustomerIds(
	ctx: QueryCtx,
	customerIds: Id<"customers">[],
) {
	const metrics = await Promise.all(
		customerIds.map(async (customerId) => {
			const customerMetrics = await ctx.db
				.query("channelMetrics")
				.withIndex("by_customer_period", (query) => query.eq("customerId", customerId))
				.collect();

			return customerMetrics;
		}),
	);
	const uniquePeriodKeys = Array.from(new Set(metrics.flat().map((metric: ChannelMetricDoc) => metric.periodKey))).sort(
		(left, right) => comparePeriodKeysDescending(left, right),
	);

	if (uniquePeriodKeys.length === 0) {
		return [];
	}

	const periodDocs = await Promise.all(
		uniquePeriodKeys.map((periodKey) =>
			ctx.db.query("reportingPeriods").withIndex("by_period_key", (query) => query.eq("periodKey", periodKey)).unique(),
		),
	);

	return periodDocs.filter((period): period is ReportingPeriodDoc => period !== null);
}

async function listMetricsForCustomerPeriod(
	ctx: QueryCtx,
	customerId: Id<"customers">,
	periodKey: string,
) {
	const metrics = await ctx.db
		.query("channelMetrics")
		.withIndex("by_customer_period", (query) => query.eq("customerId", customerId))
		.collect();

	return metrics.filter((metric) => metric.periodKey === periodKey);
}

function buildTotals(metrics: ChannelMetricDoc[]) {
	const grossRevenue = Number(metrics.reduce((sum, metric) => sum + metric.grossRevenue, 0).toFixed(2));
	const orderCount = metrics.reduce((sum, metric) => sum + metric.orderCount, 0);

	return {
		averageOrderValue: deriveAverageOrderValue(grossRevenue, orderCount),
		grossRevenue,
		orderCount,
	};
}

function buildChannelSummaries(
	metrics: ChannelMetricDoc[],
	previousMetrics: ChannelMetricDoc[],
) {
	const channelKeys = Array.from(
		new Set([...metrics.map((metric) => metric.channel), ...previousMetrics.map((metric) => metric.channel)]),
	).sort((left, right) => left.localeCompare(right));

	return channelKeys.map((channel) => {
		const currentMetrics = metrics.filter((metric) => metric.channel === channel);
		const previousChannelMetrics = previousMetrics.filter((metric) => metric.channel === channel);
		const currentTotals = buildTotals(currentMetrics);
		const previousTotals = buildTotals(previousChannelMetrics);
		const customerCount = new Set(currentMetrics.map((metric) => metric.customerId)).size;

		return {
			...currentTotals,
			customerCount,
			growthPercent: deriveGrowthPercent(currentTotals.grossRevenue, previousTotals.grossRevenue),
			key: channel,
			label: channel,
		} satisfies GroupSummary;
	});
}

function buildCustomerSummaries(
	metrics: ChannelMetricDoc[],
	previousMetrics: ChannelMetricDoc[],
	customerNamesById: Map<Id<"customers">, string>,
) {
	const customerIds = Array.from(new Set([...metrics.map((metric) => metric.customerId), ...previousMetrics.map((metric) => metric.customerId)]));

	return customerIds
		.map((customerId) => {
			const currentMetrics = metrics.filter((metric) => metric.customerId === customerId);
			const previousCustomerMetrics = previousMetrics.filter((metric) => metric.customerId === customerId);
			const currentTotals = buildTotals(currentMetrics);
			const previousTotals = buildTotals(previousCustomerMetrics);

			return {
				...currentTotals,
				customerCount: currentMetrics.length > 0 ? 1 : 0,
				growthPercent: deriveGrowthPercent(currentTotals.grossRevenue, previousTotals.grossRevenue),
				key: customerId,
				label: customerNamesById.get(customerId) ?? "Unknown customer",
			} satisfies GroupSummary;
		})
		.sort((left, right) => right.grossRevenue - left.grossRevenue);
}

function buildTrend(periods: Array<{ label: string; periodKey: string }>, metricsByPeriodKey: Map<string, ChannelMetricDoc[]>) {
	return periods
		.slice()
		.reverse()
		.map((period) => {
			const totals = buildTotals(metricsByPeriodKey.get(period.periodKey) ?? []);

			return {
				averageOrderValue: totals.averageOrderValue,
				grossRevenue: totals.grossRevenue,
				label: period.label,
				orderCount: totals.orderCount,
				periodKey: period.periodKey,
			};
		});
}

export const upsertChannelMetric = mutationGeneric({
	args: {
		channel: channelValidator,
		customerId: v.id("customers"),
		grossRevenue: v.number(),
		orderCount: v.number(),
		periodKey: v.string(),
		source: recordSourceValidator,
		sourceReference: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requirePlatformAdminMembership(ctx, identity.subject);
		const customer = await ctx.db.get(args.customerId);

		if (!customer) {
			throw new ConvexError("Customer not found");
		}

		if (!customer.activeChannels.includes(args.channel)) {
			throw new ConvexError("Selected channel is not active for this customer");
		}

		if (args.grossRevenue < 0) {
			throw new ConvexError("Gross revenue cannot be negative");
		}

		if (args.orderCount < 0) {
			throw new ConvexError("Order count cannot be negative");
		}

		const period = await ensureReportingPeriod(ctx, args.periodKey);
		const now = Date.now();
		const averageOrderValue = deriveAverageOrderValue(args.grossRevenue, args.orderCount);
		const existingMetric = (
			await ctx.db
				.query("channelMetrics")
				.withIndex("by_customer_period_channel", (query) => query.eq("customerId", args.customerId))
				.collect()
		).find((metric) => metric.periodKey === period.periodKey && metric.channel === args.channel);

		if (existingMetric) {
			await ctx.db.patch(existingMetric._id, {
				averageOrderValue,
				grossRevenue: args.grossRevenue,
				orderCount: args.orderCount,
				periodId: period._id,
				source: args.source,
				sourceReference: args.sourceReference,
				updatedAt: now,
				updatedBy: identity.subject,
			});

			return existingMetric._id;
		}

		return ctx.db.insert("channelMetrics", {
			averageOrderValue,
			channel: args.channel,
			createdAt: now,
			createdBy: identity.subject,
			customerId: args.customerId,
			grossRevenue: args.grossRevenue,
			orderCount: args.orderCount,
			periodId: period._id,
			periodKey: period.periodKey,
			source: args.source,
			sourceReference: args.sourceReference,
			updatedAt: now,
			updatedBy: identity.subject,
		});
	},
});

export const getAdminPerformanceOverview = queryGeneric({
	args: {
		periodKey: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const { customerIds, isPlatformAdmin } = await getAccessibleCustomerIds(ctx, identity.subject);

		if (!isPlatformAdmin) {
			throw new ConvexError("Platform admin access required");
		}

		const periods = await listPeriodsForCustomerIds(ctx, customerIds);
		const selectedPeriod = periods.find((period) => period.periodKey === args.periodKey) ?? periods[0] ?? null;
		const previousPeriod =
			selectedPeriod === null ? null : periods.find((period) => comparePeriodKeysDescending(selectedPeriod.periodKey, period.periodKey) > 0) ?? null;
		const metrics = selectedPeriod
			? (await Promise.all(customerIds.map((customerId) => listMetricsForCustomerPeriod(ctx, customerId, selectedPeriod.periodKey)))).flat()
			: [];
		const previousMetrics =
			previousPeriod === null
				? []
				: (await Promise.all(customerIds.map((customerId) => listMetricsForCustomerPeriod(ctx, customerId, previousPeriod.periodKey)))).flat();
		const customerDocs = await ctx.db.query("customers").collect();
		const customerNamesById = new Map(customerDocs.map((customer) => [customer._id, customer.name] as const));
		const metricsByPeriodKey = new Map<string, ChannelMetricDoc[]>();

		for (const period of periods.slice(0, 6)) {
			const periodMetrics = (await Promise.all(customerIds.map((customerId) => listMetricsForCustomerPeriod(ctx, customerId, period.periodKey)))).flat();
			metricsByPeriodKey.set(period.periodKey, periodMetrics);
		}

		return {
			availablePeriods: periods,
			byChannel: buildChannelSummaries(metrics, previousMetrics),
			byCustomer: buildCustomerSummaries(metrics, previousMetrics, customerNamesById),
			metricCount: metrics.length,
			previousPeriod,
			selectedPeriod,
			totals: buildTotals(metrics),
			trend: buildTrend(periods.slice(0, 6), metricsByPeriodKey),
		};
	},
});

export const listAdminMetricsForPeriod = queryGeneric({
	args: {
		periodKey: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const { customerIds, isPlatformAdmin } = await getAccessibleCustomerIds(ctx, identity.subject);

		if (!isPlatformAdmin) {
			throw new ConvexError("Platform admin access required");
		}

		const periods = await listPeriodsForCustomerIds(ctx, customerIds);
		const selectedPeriod = periods.find((period) => period.periodKey === args.periodKey) ?? periods[0] ?? null;

		if (!selectedPeriod) {
			return {
				availablePeriods: periods,
				metrics: [],
				selectedPeriod: null,
			};
		}

		const customerDocs = await ctx.db.query("customers").collect();
		const customerById = new Map(customerDocs.map((customer) => [customer._id, customer]));
		const metrics = (await Promise.all(customerIds.map((customerId) => listMetricsForCustomerPeriod(ctx, customerId, selectedPeriod.periodKey)))).flat();

		return {
			availablePeriods: periods,
			metrics: metrics
				.map((metric) => {
					const customer = customerById.get(metric.customerId);

					return {
						...metric,
						customerName: customer?.name ?? "Unknown customer",
						customerSlug: customer?.slug ?? "unknown-customer",
					};
				})
				.sort((left, right) => {
					if (left.customerName === right.customerName) {
						return left.channel.localeCompare(right.channel);
					}

					return left.customerName.localeCompare(right.customerName);
				}),
			selectedPeriod,
		};
	},
});

export const getCustomerPerformanceOverview = queryGeneric({
	args: {
		customerId: v.id("customers"),
		periodKey: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		await requireCustomerAccess(ctx, identity.subject, args.customerId);
		const customer = await ctx.db.get(args.customerId);

		if (!customer) {
			throw new ConvexError("Customer not found");
		}

		const periods = await listPeriodsForCustomerIds(ctx, [args.customerId]);
		const selectedPeriod = periods.find((period) => period.periodKey === args.periodKey) ?? periods[0] ?? null;
		const previousPeriod =
			selectedPeriod === null ? null : periods.find((period) => comparePeriodKeysDescending(selectedPeriod.periodKey, period.periodKey) > 0) ?? null;
		const metrics = selectedPeriod ? await listMetricsForCustomerPeriod(ctx, args.customerId, selectedPeriod.periodKey) : [];
		const previousMetrics = previousPeriod ? await listMetricsForCustomerPeriod(ctx, args.customerId, previousPeriod.periodKey) : [];
		const metricsByPeriodKey = new Map<string, ChannelMetricDoc[]>();

		for (const period of periods.slice(0, 6)) {
			metricsByPeriodKey.set(period.periodKey, await listMetricsForCustomerPeriod(ctx, args.customerId, period.periodKey));
		}

		return {
			availablePeriods: periods,
			byChannel: buildChannelSummaries(metrics, previousMetrics),
			customer,
			metricCount: metrics.length,
			previousPeriod,
			selectedPeriod,
			totals: buildTotals(metrics),
			trend: buildTrend(periods.slice(0, 6), metricsByPeriodKey),
		};
	},
});
