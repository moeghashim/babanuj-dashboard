"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type ProvidersProps = {
	children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
	return (
		<ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
			{children}
		</ThemeProvider>
	);
}
