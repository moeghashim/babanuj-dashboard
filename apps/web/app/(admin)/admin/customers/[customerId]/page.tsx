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
						<p>Update metadata, active channels, and status without affecting historical records.</p>
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
							Map Better Auth users to this customer by email and assign either `customer_viewer` or
							`platform_admin`. Users must sign up first so their account exists in the auth database.
						</p>

						<form action={upsertMembershipAction} className="shell-form">
							<input name="customerId" type="hidden" value={customer._id} />

							<div className="form-grid">
								<label className="field">
									<span className="field-label">User email</span>
									<input className="shell-input" name="memberEmail" required type="email" />
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
											<strong>{membership.userEmail}</strong>
											<p>
												{membership.role}
												{membership.userName ? ` · ${membership.userName}` : ""}
											</p>
										</div>
										<span className="inline-note">{membership.authUserId}</span>
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
