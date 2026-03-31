import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
	reactStrictMode: true,
	turbopack: {
		root: appDir,
	},
};

export default nextConfig;
