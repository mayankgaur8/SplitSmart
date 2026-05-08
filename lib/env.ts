import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(24).optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(16).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(16).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  PAGERDUTY_ROUTING_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_DOMAIN: z.string().min(1).optional(),
});

export type RuntimeEnv = z.infer<typeof envSchema>;

export function validateEnv(input: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
  }

  const env = parsed.data;
  const missing: string[] = [];
  const requireInProduction = (key: keyof RuntimeEnv) => {
    if (!env[key]) missing.push(key);
  };

  const isProductionRuntime =
    env.NODE_ENV === "production" &&
    process.env.npm_lifecycle_event !== "build" &&
    process.env.NEXT_PHASE !== "phase-production-build";

  if (isProductionRuntime) {
    requireInProduction("DATABASE_URL");
    requireInProduction("NEXTAUTH_SECRET");
    requireInProduction("NEXTAUTH_URL");
    requireInProduction("CRON_SECRET");
    requireInProduction("SENTRY_DSN");
  }

  const pairedServices: Array<[keyof RuntimeEnv, keyof RuntimeEnv, string]> = [
    ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "Razorpay API keys"],
    ["RAZORPAY_KEY_ID", "RAZORPAY_WEBHOOK_SECRET", "Razorpay webhook secret"],
    ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "Stripe webhook secret"],
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "Redis credentials"],
  ];

  for (const [left, right, label] of pairedServices) {
    if (isProductionRuntime && (env[left] || env[right]) && !(env[left] && env[right])) {
      missing.push(`${label} (${left} + ${right})` as keyof RuntimeEnv);
    }
  }

  if (isProductionRuntime && !(env.RAZORPAY_KEY_ID || env.STRIPE_SECRET_KEY)) {
    missing.push("at least one payment provider: Razorpay or Stripe" as keyof RuntimeEnv);
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }

  return env;
}

export const env = validateEnv();

export const services = {
  razorpay: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
  stripe: Boolean(env.STRIPE_SECRET_KEY),
  redis: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  ai: Boolean(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || env.GROQ_API_KEY),
  sentry: Boolean(env.SENTRY_DSN),
  email: Boolean(env.RESEND_API_KEY),
};
