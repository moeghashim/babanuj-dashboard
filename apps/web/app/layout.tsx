import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "./providers";
import "./globals.css";

const sansFont = Bricolage_Grotesque({
	subsets: ["latin"],
	variable: "--font-bricolage-grotesque",
});

export const metadata: Metadata = {
	title: "Babanuj Dashboard",
	description: "Multi-tenant dashboard for Babanuj admins and customer workspaces.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={sansFont.variable}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
