import type { CustomerChannel, CustomerRecord } from "./customers";

export const PERFORMANCE_RECORD_SOURCES = ["manual", "integration"] as const;
export type PerformanceRecordSource = (typeof PERFORMANCE_RECORD_SOURCES)[number];

export type ReportingPeriodRecord = {
	_id: string;
	createdAt: number;
	label: string;
	month: number;
	periodKey: string;
	year: number;
};

export type ChannelMetricRecord = {
	_id: string;
	averageOrderValue: number;
	channel: CustomerChannel;
	createdAt: number;
	createdBy: string;
	customerId: string;
	grossRevenue: number;
	orderCount: number;
	periodId: string;
	periodKey: string;
	source: PerformanceRecordSource;
	sourceReference?: string;
	updatedAt: number;
	updatedBy: string;
};

export type AdminMetricRecord = ChannelMetricRecord & {
	customerName: string;
	customerSlug: string;
};

export type PerformanceTotals = {
	averageOrderValue: number;
	grossRevenue: number;
	orderCount: number;
};

export type PerformanceGroupSummary = PerformanceTotals & {
	customerCount: number;
	growthPercent: number | null;
	key: string;
	label: string;
};

export type PerformanceTrendPoint = PerformanceTotals & {
	label: string;
	periodKey: string;
};

export type AdminPerformanceOverview = {
	availablePeriods: ReportingPeriodRecord[];
	byChannel: PerformanceGroupSummary[];
	byCustomer: PerformanceGroupSummary[];
	metricCount: number;
	previousPeriod: ReportingPeriodRecord | null;
	selectedPeriod: ReportingPeriodRecord | null;
	totals: PerformanceTotals;
	trend: PerformanceTrendPoint[];
};

export type CustomerPerformanceOverview = {
	availablePeriods: ReportingPeriodRecord[];
	byChannel: PerformanceGroupSummary[];
	customer: CustomerRecord;
	metricCount: number;
	previousPeriod: ReportingPeriodRecord | null;
	selectedPeriod: ReportingPeriodRecord | null;
	totals: PerformanceTotals;
	trend: PerformanceTrendPoint[];
};

export function formatCurrency(value: number, currencyCode = "USD") {
	return new Intl.NumberFormat("en-US", {
		currency: currencyCode,
		maximumFractionDigits: 2,
		minimumFractionDigits: 0,
		style: "currency",
	}).format(value);
}

export function formatNumber(value: number) {
	return new Intl.NumberFormat("en-US").format(value);
}

export function formatGrowth(value: number | null) {
	if (value === null) {
		return "No prior period";
	}

	const prefix = value > 0 ? "+" : "";
	return `${prefix}${value.toFixed(1)}%`;
}

export function normalizePeriodKey(value: string) {
	const normalized = value.trim();

	if (!/^\d{4}-\d{2}$/.test(normalized)) {
		throw new Error("Reporting period must use YYYY-MM format.");
	}

	return normalized;
}

export function parseMetricCurrencyValue(value: FormDataEntryValue | null, fieldName: string) {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${fieldName} is required`);
	}

	const parsedValue = Number(value);

	if (!Number.isFinite(parsedValue) || parsedValue < 0) {
		throw new Error(`${fieldName} must be a non-negative number`);
	}

	return Number(parsedValue.toFixed(2));
}

export function parseMetricIntegerValue(value: FormDataEntryValue | null, fieldName: string) {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`${fieldName} is required`);
	}

	const parsedValue = Number(value);

	if (!Number.isInteger(parsedValue) || parsedValue < 0) {
		throw new Error(`${fieldName} must be a non-negative whole number`);
	}

	return parsedValue;
}

export function resolveDefaultPeriodKey(periods: ReportingPeriodRecord[]) {
	return periods[0]?.periodKey ?? new Date().toISOString().slice(0, 7);
}
