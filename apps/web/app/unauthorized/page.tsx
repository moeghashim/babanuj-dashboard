import { Card, CardContent } from "@heroui/react";
import Link from "next/link";

export default function UnauthorizedPage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Unauthorized</p>
				<h1>You do not have access to this area.</h1>
				<p className="hero-copy">
					Babanuj admins require a `platform_admin` membership. Customer users need an active customer workspace
					and `customer_viewer` access.
				</p>
				<div className="hero-actions">
					<Link href="/">Return home</Link>
				</div>
			</section>

			<Card className="shell-panel">
				<CardContent>
					<h2>Access model</h2>
					<p>
						Access checks run inside server layouts and Convex functions so route protection does not depend only
						on client navigation.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
