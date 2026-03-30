import { Button } from "@heroui/react";
import Link from "next/link";

import { setActiveCustomerAction } from "../app/select-org/actions";
import { getCurrentAppSession } from "../lib/auth";
import { SignOutButton } from "./sign-out-button";

type SessionControlsProps = {
	showCustomerSwitcher?: boolean;
};

export async function SessionControls({ showCustomerSwitcher = false }: SessionControlsProps) {
	const session = await getCurrentAppSession();

	return (
		<div className="session-controls">
			{session.userId ? (
				<>
					{showCustomerSwitcher && session.accessibleCustomers.length > 0 ? (
						<form action={setActiveCustomerAction} className="organization-switcher">
							<select
								className="organization-switcher-trigger"
								defaultValue={session.activeCustomerId ?? ""}
								name="customerId"
							>
								<option disabled value="">
									Select customer
								</option>
								{session.accessibleCustomers.map((customer) => (
									<option key={customer._id} value={customer._id}>
										{customer.name}
									</option>
								))}
							</select>
							<Button type="submit" variant="ghost">
								Use workspace
							</Button>
						</form>
					) : null}
					<SignOutButton />
				</>
			) : (
				<>
					<Link className="shell-button" href="/sign-in">
						Sign in
					</Link>
					<Link className="shell-nav-link" href="/sign-up">
						Create account
					</Link>
				</>
			)}
		</div>
	);
}
