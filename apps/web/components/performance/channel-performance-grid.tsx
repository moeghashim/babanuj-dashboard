import { formatCurrency, formatGrowth, formatNumber, type PerformanceGroupSummary } from "../../lib/performance";

type ChannelPerformanceGridProps = {
	currencyCode?: string;
	items: PerformanceGroupSummary[];
	title: string;
};

export function ChannelPerformanceGrid({ currencyCode = "USD", items, title }: ChannelPerformanceGridProps) {
	if (items.length === 0) {
		return <p className="inline-note">No channel metrics exist for this period yet.</p>;
	}

	return (
		<section aria-label={title} className="performance-grid">
			{items.map((item) => (
				<article className="performance-card" key={item.key}>
					<p className="eyebrow">{item.label}</p>
					<h3>{formatCurrency(item.grossRevenue, currencyCode)}</h3>
					<ul className="metric-list">
						<li>Orders: {formatNumber(item.orderCount)}</li>
						<li>AOV: {formatCurrency(item.averageOrderValue, currencyCode)}</li>
						<li>Growth: {formatGrowth(item.growthPercent)}</li>
						<li>Customers: {formatNumber(item.customerCount)}</li>
					</ul>
				</article>
			))}
		</section>
	);
}
