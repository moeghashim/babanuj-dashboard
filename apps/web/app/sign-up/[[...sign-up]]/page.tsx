import { SignUpForm } from "../../../components/sign-up-form";

type SignUpPageProps = {
	searchParams?: Promise<{ email?: string; invite?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const defaultEmail = typeof resolvedSearchParams?.email === "string" ? resolvedSearchParams.email : undefined;
	const inviteToken = typeof resolvedSearchParams?.invite === "string" ? resolvedSearchParams.invite : undefined;

	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Authentication</p>
				<h1>{inviteToken ? "Accept your Babanuj invite." : "Create your Babanuj access."}</h1>
				{inviteToken ? (
					<p className="shell-copy">
						Create the account tied to the invited email so the customer access can be attached automatically.
					</p>
				) : null}
				<div className="hero-actions">
					<SignUpForm defaultEmail={defaultEmail} inviteToken={inviteToken} />
				</div>
			</section>
		</main>
	);
}
