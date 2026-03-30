import { Card, CardContent, Chip } from "@heroui/react";

const appCards = [
	{
		title: "Model customer performance",
		description:
			"Track monthly results across Website, B2B, Amazon, TikTok, Etsy, Walmart, and Temu for every customer.",
		accent: "Monthly channel view",
	},
	{
		title: "Run the admin workspace",
		description:
			"Give Babanuj admins one place to manage customer setup, aggregate reporting, invoices, and payments.",
		accent: "Cross-customer rollups",
	},
	{
		title: "Keep customers informed",
		description:
			"Deliver read-only customer dashboards with scoped performance trends, invoice history, and current balances.",
		accent: "View-only by org",
	},
];

export default function HomePage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Babanuj Dashboard</p>
				<h1>
					Operate every customer.
					<br />
					See the whole business.
				</h1>
				<p className="hero-copy">
					A multi-tenant control center for Babanuj: admin reporting across all customers, customer-specific
					dashboards, and finance tracking built for manual entry first and API integrations next.
				</p>
				<div className="hero-actions">
					<a href="#capabilities">See the scope</a>
					<a href="#build-sequence">View the rollout</a>
				</div>
			</section>

			<section className="card-grid" aria-label="Starter capabilities" id="capabilities">
				{appCards.map((card) => (
					<Card className="feature-card" key={card.title}>
						<CardContent>
							<Chip className="card-accent" color="accent" variant="soft">
								{card.accent}
							</Chip>
							<h2>{card.title}</h2>
							<p>{card.description}</p>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="workflow-panel" id="build-sequence">
				<div>
					<p className="eyebrow">Build sequence</p>
					<h2>Ship the platform in layers.</h2>
				</div>
				<pre>
					<code>{`1. Multi-tenant foundation
2. Customer management
3. Performance dashboards
4. Finance ledger
5. QA and rollout docs`}</code>
				</pre>
			</section>
		</main>
	);
}
