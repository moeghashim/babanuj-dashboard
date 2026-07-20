import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm } from "../../../../../components/customers/customer-form";
import { requirePlatformAdmin } from "../../../../../lib/auth";
import { getCustomerById, listInvitesForCustomer, listMembershipsForCustomer } from "../../../../../lib/convex-server";
import { formatDate } from "../../../../../lib/finance";
import { createCustomerInviteAction, updateCustomerAction, upsertMembershipAction } from "../actions";

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

	const [memberships, invites] = await Promise.all([
		listMembershipsForCustomer(customerId),
		listInvitesForCustomer(customerId),
	]);

	return (
		<div className="shell-content">
			<section className="status-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-accent">Customer details</span>
					<h2>Maintain the customer record</h2>
					<p>Update metadata, active channels, and status without affecting historical records.</p>
					<CustomerForm action={updateCustomerAction} customer={customer} submitLabel="Save customer" />
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-success">Memberships</span>
					<h2>Map customer access</h2>
					<p>
						Map Better Auth users to this customer by email and assign either `customer_viewer` or
						`platform_admin`. If the user has not created an account yet, send a customer invite below.
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
				</div>
			</section>

			<section className="status-grid">
				<div className="shell-panel">
					<span className="shell-chip shell-chip-warning">Invites</span>
					<h2>Send invite links</h2>
					<p>
						Create a customer-scoped invite link for a specific email. The recipient can sign up or sign in and
						the invite will attach the correct membership automatically.
					</p>

					<form action={createCustomerInviteAction} className="shell-form">
						<input name="customerId" type="hidden" value={customer._id} />

						<div className="form-grid">
							<label className="field">
								<span className="field-label">Invite email</span>
								<input className="shell-input" name="inviteEmail" required type="email" />
							</label>

							<label className="field">
								<span className="field-label">Role</span>
								<select className="shell-select" defaultValue="customer_viewer" name="role">
									<option value="customer_viewer">customer_viewer</option>
									<option value="platform_admin">platform_admin</option>
								</select>
							</label>

							<label className="field">
								<span className="field-label">Expires on</span>
								<input className="shell-input" name="expiresOn" required type="date" />
							</label>
						</div>

						<button className="shell-button" type="submit">
							Create invite
						</button>
					</form>
				</div>

				<div className="shell-panel">
					<span className="shell-chip shell-chip-default">Active links</span>
					<h2>Customer invite ledger</h2>
					{invites.length === 0 ? (
						<p>No invites created yet.</p>
					) : (
						<ul className="record-list">
							{invites.map((invite) => {
								const inviteUrl = `/invite/${invite.token}`;
								return (
									<li className="record-row" key={invite._id}>
										<div>
											<strong>{invite.email}</strong>
											<p>
												{invite.role} · {invite.status} · Expires {formatDate(invite.expiresAt)}
											</p>
											<p>
												<a className="shell-nav-link" href={inviteUrl}>
													Open invite
												</a>
											</p>
										</div>
										<span className="inline-note">
											{invite.acceptedAt
												? `Accepted ${formatDate(invite.acceptedAt)}`
												: "Pending acceptance"}
										</span>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>

			<div className="shell-panel">
				<h2>Navigation</h2>
				<p>
					<Link className="shell-nav-link" href="/admin/customers">
						Back to all customers
					</Link>
				</p>
			</div>
		</div>
	);
}
