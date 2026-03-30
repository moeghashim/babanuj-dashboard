"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

const convex = process.env.NEXT_PUBLIC_CONVEX_URL ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL) : null;

type ProvidersProps = {
	children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
	const content = (
		<ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
			{convex ? (
				<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
					{children}
				</ConvexProviderWithClerk>
			) : (
				children
			)}
		</ThemeProvider>
	);

	return <ClerkProvider>{content}</ClerkProvider>;
}
