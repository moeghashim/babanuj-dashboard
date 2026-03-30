import { Card, CardContent, Chip } from "@heroui/react";

import { getCurrentAppSession } from "../../../lib/auth";

export default async function CustomerPage() {
	const session = await getCurrentAppSession();

	return (
		<div className="shell-content">
			<section className="shell-grid">
				<Card className="shell-panel">
					<CardContent>
						<Chip color="default" variant="soft">
							Scope
						</Chip>
						<h2>Customer-only visibility</h2>
						<p>
							This route requires an active customer workspace and is reserved for customer viewers plus platform
							admins inspecting the customer-facing experience.
						</p>
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<Chip color="accent" variant="soft">
							Next module
						</Chip>
						<h2>Performance and finance follow next</h2>
						<p>
							The foundation is in place for org-scoped monthly channel metrics, invoices, payments, and balance
							summaries.
						</p>
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<Chip color="success" variant="soft">
							Selected customer
						</Chip>
						<h2>Active workspace</h2>
						<p>{session.activeCustomerId ?? "No customer selected"}</p>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
