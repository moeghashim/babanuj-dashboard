import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<main className="page-shell">
			<section className="hero">
				<p className="eyebrow">Authentication</p>
				<h1>Sign in to Babanuj.</h1>
				<div className="hero-actions">
					<SignIn signUpUrl="/sign-up" />
				</div>
			</section>
		</main>
	);
}
