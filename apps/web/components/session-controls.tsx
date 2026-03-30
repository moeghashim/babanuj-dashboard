"use client";

import { OrganizationSwitcher, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "@heroui/react";

type SessionControlsProps = {
	showOrganizationSwitcher?: boolean;
};

export function SessionControls({ showOrganizationSwitcher = false }: SessionControlsProps) {
	const { userId } = useAuth();

	return (
		<div className="session-controls">
			{userId ? (
				<>
					{showOrganizationSwitcher ? (
						<div className="organization-switcher">
							<OrganizationSwitcher
								appearance={{
									elements: {
										rootBox: "organization-switcher-box",
										organizationSwitcherTrigger: "organization-switcher-trigger",
									},
								}}
								hidePersonal
							/>
						</div>
					) : null}
					<UserButton />
				</>
			) : (
				<>
					<SignInButton mode="modal">
						<Button variant="primary">Sign in</Button>
					</SignInButton>
					<SignUpButton mode="modal">
						<Button variant="secondary">Create account</Button>
					</SignUpButton>
				</>
			)}
		</div>
	);
}
