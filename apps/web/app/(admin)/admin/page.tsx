import { ChannelPerformanceGrid } from "../../../components/performance/channel-performance-grid";
import { PerformanceChart } from "../../../components/performance/performance-chart";
import { getCurrentAppSession } from "../../../lib/auth";
import { getAdminPerformanceOverview } from "../../../lib/convex-server";
import { formatCurrency, formatGrowth, formatNumber } from "../../../lib/performance";

export default async function AdminPage() {
	const session = await getCurrentAppSession();
	const overview = await getAdminPerformanceOverview();
	const currencyCode = session.accessibleCustomers[0]?.currencyCode ?? "USD";

	return (
		<div className="shell-content">
			<section className="status-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-accent">Tenancy</span>
					<h2>{overview.selectedPeriod?.label ?? "No reporting month yet"}</h2>
					<p>
						{formatCurrency(overview.totals.grossRevenue, currencyCode)} total revenue across the active customer
						book.
					</p>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">Data layer</span>
					<h2>{formatNumber(overview.metricCount)} period records</h2>
					<p>
						{formatNumber(overview.totals.orderCount)} orders ·{" "}
						{formatCurrency(overview.totals.averageOrderValue, currencyCode)} AOV
					</p>
				</div>

				<div className="shell-panel env-callout">
					<span className="shell-chip shell-chip-warning">Setup required</span>
					<h2>Growth against prior month</h2>
					<p>
						{overview.byChannel.length === 0
							? "Save the first monthly metric to unlock rollups."
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
					<h2>Recent periods</h2>
					<PerformanceChart currencyCode={currencyCode} points={overview.trend} title="Admin revenue trend" />
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-default">Current session</span>
					<h2>Access context</h2>
					<ul>
						<li>User ID: {session.userId ?? "Not signed in"}</li>
						<li>App role: {session.appRole ?? "No mapped role yet"}</li>
						<li>Active customer: {session.activeCustomerId ?? "No customer selected"}</li>
					</ul>
				</div>
			</section>

			<div className="shell-panel">
				<span className="shell-chip shell-chip-accent">By channel</span>
				<h2>Aggregate channel mix</h2>
				<ChannelPerformanceGrid
					currencyCode={currencyCode}
					items={overview.byChannel}
					title="Admin channel performance"
				/>
			</div>
		</div>
	);
}
