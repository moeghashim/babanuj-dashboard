import { Card, CardContent, Chip } from "@heroui/react";

import { CHANNELS, getCurrentAppSession } from "../../../lib/auth";

export default async function AdminPage() {
	const session = await getCurrentAppSession();

	return (
		<div className="shell-content">
			<section className="shell-grid">
				<Card className="shell-panel">
					<CardContent>
						<Chip color="accent" variant="soft">
							Tenancy
						</Chip>
						<h2>Role-aware access</h2>
						<p>
							Admin routes are protected by Better Auth sessions plus Convex role checks. Platform admins are
							resolved from the customer membership model instead of auth-provider metadata.
						</p>
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<Chip color="success" variant="soft">
							Data layer
						</Chip>
						<h2>Convex foundation</h2>
						<p>
							Customers and customer memberships are modeled in Convex so future metric, invoice, and payment
							workflows inherit the same tenancy boundaries.
						</p>
					</CardContent>
				</Card>

				<Card className="shell-panel env-callout">
					<CardContent>
						<Chip color="warning" variant="soft">
							Setup required
						</Chip>
						<h2>Configure environment keys</h2>
						<p>
							Add Better Auth and Convex variables from `.env.example`, then create the first customer to seed
							the bootstrap admin membership.
						</p>
					</CardContent>
				</Card>
			</section>

			<section className="status-grid">
				<Card className="shell-panel">
					<CardContent>
						<h3>Current session</h3>
						<ul>
							<li>User ID: {session.userId ?? "Not signed in"}</li>
							<li>App role: {session.appRole ?? "No mapped role yet"}</li>
							<li>Active customer: {session.activeCustomerId ?? "No customer selected"}</li>
						</ul>
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<h3>V1 channels</h3>
						<ul>
							{CHANNELS.map((channel) => (
								<li key={channel}>{channel}</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
