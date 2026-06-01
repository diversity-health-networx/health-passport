import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
		server: {
				CLOUDFLARE_D1_DATABASE_ID: z.string().min(1),
				POSTMARK_SERVER_TOKEN: z.string().min(1),
				MAGIC_LINK_SECRET: z.string().min(32),
				POSTHOG_API_KEY: z.string().optional(),
		},
		clientPrefix: "VITE_",
		client: {
				VITE_SENTRY_DSN: z.string().url().optional(),
				VITE_POSTHOG_KEY: z.string().optional(),
		},
		runtimeEnv: import.meta.env,
		emptyStringAsUndefined: true,
});