import { Card, CardContent } from "@heroui/react";

import { SessionControls } from "../../components/session-controls";

export default function SelectOrgPage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Organization required</p>
				<h1>Select the customer workspace you want to view.</h1>
				<p className="hero-copy">
					Customer viewers need an active Clerk organization before entering the customer dashboard. Babanuj admins
					can use the admin area without setting an active organization.
				</p>
				<div className="hero-actions">
					<SessionControls showOrganizationSwitcher />
				</div>
			</section>

			<Card className="shell-panel">
				<CardContent>
					<h2>Admin note</h2>
					<p>
						Customer organizations should map to Convex customer records through `clerkOrganizationId` so later
						performance and finance data stays tenant-safe.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
