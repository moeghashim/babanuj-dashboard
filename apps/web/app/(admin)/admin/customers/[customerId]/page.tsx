import { Card, CardContent, Chip } from "@heroui/react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm } from "../../../../../components/customers/customer-form";
import { requirePlatformAdmin } from "../../../../../lib/auth";
import { getCustomerById, listMembershipsForCustomer } from "../../../../../lib/convex-server";
import { updateCustomerAction, upsertMembershipAction } from "../actions";

type CustomerDetailPageProps = {
	params: Promise<{ customerId: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
	await requirePlatformAdmin();
	const { customerId } = await params;
	const customer = await getCustomerById(customerId);

	if (!customer) {
		notFound();
	}

	const memberships = await listMembershipsForCustomer(customerId);

	return (
		<div className="shell-content">
			<section className="status-grid">
				<Card className="shell-panel">
					<CardContent>
						<Chip color="accent" variant="soft">
							Customer details
						</Chip>
						<h2>Maintain the customer record</h2>
						<p>
							Update metadata, organization mapping, active channels, and status without affecting historical
							records.
						</p>
						<CustomerForm action={updateCustomerAction} customer={customer} submitLabel="Save customer" />
					</CardContent>
				</Card>

				<Card className="shell-panel">
					<CardContent>
						<Chip color="success" variant="soft">
							Memberships
						</Chip>
						<h2>Map customer access</h2>
						<p>
							Add Clerk user IDs to the customer and assign either `customer_viewer` or `platform_admin`. This
							maps runtime access once org auth is live.
						</p>

						<form action={upsertMembershipAction} className="shell-form">
							<input name="customerId" type="hidden" value={customer._id} />
							<input name="clerkOrganizationId" type="hidden" value={customer.clerkOrganizationId} />

							<div className="form-grid">
								<label className="field">
									<span className="field-label">Clerk user ID</span>
									<input className="shell-input" name="clerkUserId" required type="text" />
								</label>

								<label className="field">
									<span className="field-label">Role</span>
									<select className="shell-select" defaultValue="customer_viewer" name="role">
										<option value="customer_viewer">customer_viewer</option>
										<option value="platform_admin">platform_admin</option>
									</select>
								</label>
							</div>

							<button className="shell-button" type="submit">
								Save membership
							</button>
						</form>

						{memberships.length === 0 ? (
							<p>No mapped memberships yet.</p>
						) : (
							<ul className="record-list">
								{memberships.map((membership) => (
									<li className="record-row" key={membership._id}>
										<div>
											<strong>{membership.clerkUserId}</strong>
											<p>{membership.role}</p>
										</div>
										<span className="inline-note">{membership.clerkOrganizationId ?? "No org mapping"}</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</section>

			<Card className="shell-panel">
				<CardContent>
					<h2>Navigation</h2>
					<p>
						<Link className="shell-nav-link" href="/admin/customers">
							Back to all customers
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
