import { formatCurrency, formatNumber, type PerformanceTrendPoint } from "../../lib/performance";

type PerformanceChartProps = {
	currencyCode?: string;
	points: PerformanceTrendPoint[];
	title: string;
};

export function PerformanceChart({ currencyCode = "USD", points, title }: PerformanceChartProps) {
	if (points.length === 0) {
		return <p className="inline-note">Trend data appears after at least one reporting month is saved.</p>;
	}

	const maxRevenue = Math.max(...points.map((point) => point.grossRevenue), 1);

	return (
		<section aria-label={title} className="trend-chart">
			{points.map((point) => (
				<div className="trend-row" key={point.periodKey}>
					<div className="trend-meta">
						<strong>{point.label}</strong>
						<span>{formatCurrency(point.grossRevenue, currencyCode)}</span>
					</div>
					<div className="trend-bar-track">
						<div
							className="trend-bar-fill"
							style={{ width: `${Math.max((point.grossRevenue / maxRevenue) * 100, 6)}%` }}
						/>
					</div>
					<p className="inline-note">
						{formatNumber(point.orderCount)} orders · {formatCurrency(point.averageOrderValue, currencyCode)} AOV
					</p>
				</div>
			))}
		</section>
	);
}
