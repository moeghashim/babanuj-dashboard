import Link from "next/link";

import { ChannelPerformanceGrid } from "../../../../components/performance/channel-performance-grid";
import { MetricEntryForm } from "../../../../components/performance/metric-entry-form";
import { PerformanceChart } from "../../../../components/performance/performance-chart";
import { requirePlatformAdmin } from "../../../../lib/auth";
import {
	getAdminPerformanceOverview,
	listAccessibleCustomers,
	listAdminMetricsForPeriod,
} from "../../../../lib/convex-server";
import { formatCurrency, formatGrowth, formatNumber, resolveDefaultPeriodKey } from "../../../../lib/performance";
import { upsertChannelMetricAction } from "./actions";

type PerformancePageProps = {
	searchParams?: Promise<{ period?: string }>;
};

export default async function AdminPerformancePage({ searchParams }: PerformancePageProps) {
	await requirePlatformAdmin();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const selectedPeriodKey = typeof resolvedSearchParams?.period === "string" ? resolvedSearchParams.period : undefined;
	const [customers, overview, metricListing] = await Promise.all([
		listAccessibleCustomers(),
		getAdminPerformanceOverview(selectedPeriodKey),
		listAdminMetricsForPeriod(selectedPeriodKey),
	]);
	const currencyCode = customers[0]?.currencyCode ?? "USD";
	const defaultPeriodKey = resolveDefaultPeriodKey(metricListing.availablePeriods);

	return (
		<div className="shell-content">
			<section className="status-grid">
				<div className="shell-panel">
					<p className="eyebrow">Selected period</p>
					<h2>{overview.selectedPeriod?.label ?? "No period selected"}</h2>
					<p className="shell-copy">
						{overview.selectedPeriod
							? `Comparing against ${overview.previousPeriod?.label ?? "no prior period yet"}.`
							: "Save the first monthly metric to start reporting."}
					</p>
				</div>

				<div className="shell-panel">
					<p className="eyebrow">Revenue</p>
					<h2>{formatCurrency(overview.totals.grossRevenue, currencyCode)}</h2>
					<p className="inline-note">
						{formatNumber(overview.totals.orderCount)} orders ·{" "}
						{formatCurrency(overview.totals.averageOrderValue, currencyCode)} AOV
					</p>
				</div>

				<div className="shell-panel">
					<p className="eyebrow">Coverage</p>
					<h2>{formatNumber(overview.metricCount)} channel records</h2>
					<p className="inline-note">
						{formatNumber(overview.byCustomer.length)} customers represented in this period.
					</p>
				</div>

				<div className="shell-panel">
					<p className="eyebrow">Periods</p>
					<div className="period-links">
						{overview.availablePeriods.length === 0 ? (
							<p className="inline-note">No reporting periods yet.</p>
						) : (
							overview.availablePeriods.map((period) => (
								<Link
									className={`shell-nav-link${period.periodKey === overview.selectedPeriod?.periodKey ? " is-active" : ""}`}
									href={`/admin/performance?period=${period.periodKey}`}
									key={period._id}
								>
									{period.label}
								</Link>
							))
						)}
					</div>
				</div>
			</section>

			<section className="shell-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-accent">Admin entry</span>
					<h2>Save monthly customer-channel metrics</h2>
					<p>
						Manual entry is admin-only in v1. Each submission updates the unique customer + period + channel
						record and preserves whether the data came from a manual workflow or a future integration.
					</p>
					<MetricEntryForm
						action={upsertChannelMetricAction}
						customers={customers}
						defaultPeriodKey={defaultPeriodKey}
					/>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">Trend</span>
					<h2>Revenue trend</h2>
					<PerformanceChart currencyCode={currencyCode} points={overview.trend} title="Aggregate revenue trend" />
				</div>
			</section>

			<div className="shell-panel">
				<span className="shell-chip shell-chip-accent">By channel</span>
				<h2>Channel rollup</h2>
				<ChannelPerformanceGrid
					currencyCode={currencyCode}
					items={overview.byChannel}
					title="Aggregate channel performance"
				/>
			</div>

			<section className="shell-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">By customer</span>
					<h2>Customer contribution</h2>
					{overview.byCustomer.length === 0 ? (
						<p className="inline-note">No customer performance has been entered yet.</p>
					) : (
						<ul className="record-list">
							{overview.byCustomer.map((customerSummary) => (
								<li className="record-row" key={customerSummary.key}>
									<div>
										<strong>{customerSummary.label}</strong>
										<p>
											{formatCurrency(customerSummary.grossRevenue, currencyCode)} ·{" "}
											{formatNumber(customerSummary.orderCount)} orders
										</p>
									</div>
									<span className="inline-note">{formatGrowth(customerSummary.growthPercent)}</span>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-warning">Detailed records</span>
					<h2>Period entries</h2>
					{metricListing.metrics.length === 0 ? (
						<p className="inline-note">No saved metric rows for this period yet.</p>
					) : (
						<ul className="record-list">
							{metricListing.metrics.map((metric) => (
								<li className="record-row" key={metric._id}>
									<div>
										<strong>
											{metric.customerName} · {metric.channel}
										</strong>
										<p>
											{formatCurrency(metric.grossRevenue, currencyCode)} · {formatNumber(metric.orderCount)}{" "}
											orders · {metric.source}
										</p>
									</div>
									<span className="inline-note">{metric.sourceReference ?? "No source reference"}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	);
}
