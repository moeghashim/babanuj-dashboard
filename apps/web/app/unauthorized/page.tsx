import { Card, CardContent } from "@heroui/react";
import Link from "next/link";

export default function UnauthorizedPage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Unauthorized</p>
				<h1>You do not have access to this area.</h1>
				<p className="hero-copy">
					Babanuj admins require `publicMetadata.appRole = "platform_admin"`. Customer users need a valid active
					organization and customer-viewer access.
				</p>
				<div className="hero-actions">
					<Link href="/">Return home</Link>
				</div>
			</section>

			<Card className="shell-panel">
				<CardContent>
					<h2>Access model</h2>
					<p>
						Foundation access checks run in middleware and again inside server layouts so route protection does
						not depend only on client navigation.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
