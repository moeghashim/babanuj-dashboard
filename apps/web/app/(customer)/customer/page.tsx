import { ChannelPerformanceGrid } from "../../../components/performance/channel-performance-grid";
import { PerformanceChart } from "../../../components/performance/performance-chart";
import { getCurrentAppSession } from "../../../lib/auth";
import { getCustomerPerformanceOverview } from "../../../lib/convex-server";
import { formatCurrency, formatGrowth, formatNumber } from "../../../lib/performance";

type CustomerPageProps = {
	searchParams?: Promise<{ period?: string }>;
};

export default async function CustomerPage({ searchParams }: CustomerPageProps) {
	const session = await getCurrentAppSession();
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const selectedPeriodKey = typeof resolvedSearchParams?.period === "string" ? resolvedSearchParams.period : undefined;

	if (!session.activeCustomerId) {
		throw new Error("Customer dashboard requires an active customer.");
	}

	const overview = await getCustomerPerformanceOverview(session.activeCustomerId, selectedPeriodKey);
	const currencyCode = overview.customer.currencyCode;

	return (
		<div className="shell-content">
			<section className="status-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-default">Scope</span>
					<h2>{overview.customer.name}</h2>
					<p>
						{overview.selectedPeriod?.label ?? "No reporting month yet"} ·{" "}
						{formatCurrency(overview.totals.grossRevenue, currencyCode)}
					</p>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-accent">Next module</span>
					<h2>Orders and AOV</h2>
					<p>
						{formatNumber(overview.totals.orderCount)} orders ·{" "}
						{formatCurrency(overview.totals.averageOrderValue, currencyCode)} average order value
					</p>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">Selected customer</span>
					<h2>Growth snapshot</h2>
					<p>
						{overview.byChannel.length === 0
							? "Trend data appears after the first saved month."
							: overview.byChannel
									.map((channel) => `${channel.label}: ${formatGrowth(channel.growthPercent)}`)
									.slice(0, 3)
									.join(" · ")}
					</p>
				</div>
			</section>

			<section className="shell-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">Trend</span>
					<h2>Recent months</h2>
					<PerformanceChart currencyCode={currencyCode} points={overview.trend} title="Customer revenue trend" />
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-default">Period selector</span>
					<h2>Available periods</h2>
					<div className="period-links">
						{overview.availablePeriods.length === 0 ? (
							<p className="inline-note">No reporting periods are available yet.</p>
						) : (
							overview.availablePeriods.map((period) => (
								<a
									className={`shell-nav-link${period.periodKey === overview.selectedPeriod?.periodKey ? " is-active" : ""}`}
									href={`/customer?period=${period.periodKey}`}
									key={period._id}
								>
									{period.label}
								</a>
							))
						)}
					</div>
				</div>
			</section>

			<div className="shell-panel">
				<span className="shell-chip shell-chip-accent">By channel</span>
				<h2>Channel performance</h2>
				<ChannelPerformanceGrid
					currencyCode={currencyCode}
					items={overview.byChannel}
					title="Customer channel performance"
				/>
			</div>
		</div>
	);
}
