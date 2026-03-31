import { getCurrentAppSession } from "../../lib/auth";
import { setActiveCustomerAction } from "./actions";

export default async function SelectOrgPage() {
	const session = await getCurrentAppSession();

	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Customer workspace required</p>
				<h1>Select the customer workspace you want to view.</h1>
				<p className="hero-copy">
					Customer viewers need an active Babanuj customer workspace before entering the customer dashboard.
					Platform admins can switch between customers to preview the customer experience.
				</p>
				{session.accessibleCustomers.length === 0 ? (
					<p className="inline-note">No customer workspaces are mapped to your account yet.</p>
				) : (
					<form action={setActiveCustomerAction} className="shell-form">
						<label className="field">
							<span className="field-label">Customer workspace</span>
							<select className="shell-select" defaultValue={session.activeCustomerId ?? ""} name="customerId">
								<option disabled value="">
									Select customer
								</option>
								{session.accessibleCustomers.map((customer) => (
									<option key={customer._id} value={customer._id}>
										{customer.name} · {customer.slug}
									</option>
								))}
							</select>
						</label>
						<button className="shell-button" type="submit">
							Open customer workspace
						</button>
					</form>
				)}
			</section>

			<div className="shell-panel">
				<h2>Admin note</h2>
				<p>
					Customer selection is now an app-owned tenant boundary. Convex still enforces customer-scoped data access
					on the server side.
				</p>
			</div>
		</main>
	);
}
