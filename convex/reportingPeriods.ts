import { ConvexError, v } from "convex/values";
import { queryGeneric } from "convex/server";

import { getViewerMemberships, requireIdentity } from "./auth";

function comparePeriodKeysDescending(left: string, right: string) {
	return right.localeCompare(left);
}

function mapPeriodsForKeys(periodKeys: string[], periodDocs: Array<{ _id: string; label: string; month: number; periodKey: string; year: number }>) {
	const periodsByKey = new Map(periodDocs.map((period) => [period.periodKey, period]));

	return periodKeys
		.map((periodKey) => periodsByKey.get(periodKey))
		.filter((period): period is NonNullable<typeof period> => period !== undefined)
		.sort((left, right) => comparePeriodKeysDescending(left.periodKey, right.periodKey));
}

export const listReportingPeriods = queryGeneric({
	args: {
		customerId: v.optional(v.id("customers")),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const memberships = await getViewerMemberships(ctx, identity.subject);
		const isPlatformAdmin = memberships.some((membership) => membership.role === "platform_admin");
		const requestedCustomerId = args.customerId ?? null;

		if (requestedCustomerId && !isPlatformAdmin) {
			const hasCustomerAccess = memberships.some((membership) => membership.customerId === requestedCustomerId);

			if (!hasCustomerAccess) {
				throw new ConvexError("Customer access required");
			}
		}

		const accessibleCustomerIds = requestedCustomerId
			? [requestedCustomerId]
			: isPlatformAdmin
				? (await ctx.db.query("customers").collect()).map((customer) => customer._id)
				: memberships.map((membership) => membership.customerId);
		const metrics = await Promise.all(
			accessibleCustomerIds.map((customerId) =>
				ctx.db.query("channelMetrics").withIndex("by_customer_period", (query) => query.eq("customerId", customerId)).collect(),
			),
		);
		const uniquePeriodKeys = Array.from(new Set(metrics.flat().map((metric) => metric.periodKey))).sort(comparePeriodKeysDescending);

		if (uniquePeriodKeys.length === 0) {
			return [];
		}

		const allPeriods = await ctx.db.query("reportingPeriods").collect();
		return mapPeriodsForKeys(uniquePeriodKeys, allPeriods);
	},
});
