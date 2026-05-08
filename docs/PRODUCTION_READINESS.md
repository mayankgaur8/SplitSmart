# SplitSmart Production Readiness

## Go / No-Go

Status: **conditional go** after production environment provisioning, Prisma migration application, and live payment-provider webhook smoke tests.

The application now fails fast for missing production-critical secrets, records payment/webhook idempotency state, applies transactional settlement balance updates, adds legal pages, and includes operational runbooks. The remaining risks are mostly external-provider and infrastructure validation items that cannot be proven from a local checkout.

## Gaps Found And Closed

- Environment validation was implicit. Added typed startup validation in `lib/env.ts`.
- Several thrown route errors carried `statusCode` but were returned as 500. `handleError` now preserves explicit statuses.
- Settlement completion and balance updates were not atomic. Payment success processing now uses a transaction and is idempotent if already completed.
- Payment/webhook replay metadata was missing. Added `Payment` and `WebhookEvent` models, provider event IDs, idempotency keys, and webhook failure storage.
- Expense creation updated balances outside the create transaction. It now validates every participant is a group member and writes expense, splits, balances, and audit log atomically.
- Legal/compliance pages were missing. Added privacy, terms, and refund policy pages.
- AI calls lacked timeout and prompt/data safety checks. Added timeout, sensitive-payment filtering, prompt-injection checks, and usage logging.
- Admin visibility into webhook failures was missing. Added `/admin/webhooks`.

## Migration Rollback Notes

1. Back up production DB before deploy: `pg_dump "$DATABASE_URL" > backups/pre-hardening.sql`.
2. Apply Prisma migration in a maintenance window.
3. If rollback is required, deploy the previous app version first, then remove only newly added tables/columns after confirming no old code references them:
   - `Payment`
   - `WebhookEvent`
   - `PasswordResetToken`
   - `RevokedSession`
   - `ImpersonationSession`
   - new nullable user/settlement/notification columns
4. Restore from backup if data shape is uncertain.

## Deployment Checklist

- Set production env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `SENTRY_DSN`.
- Configure at least one payment provider: Razorpay or Stripe, including webhook secret.
- Configure Redis for rate limiting, replay control, and cache in production.
- Configure Resend/Twilio only after sender domains/templates are verified.
- Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run build`.
- Run Prisma generate and deploy migration before routing traffic.
- Validate `/api/health` from the deployed domain.
- Send Stripe and Razorpay test webhooks and confirm `WebhookEvent.status=PROCESSED`.
- Verify cron routes reject missing/invalid `CRON_SECRET`.
- Confirm Sentry receives a test event with user context removed/redacted as expected.

## Backup And Restore

- Daily automated DB backups with 30-day retention.
- Weekly restore drill into a staging database.
- Store backup credentials outside Vercel and rotate quarterly.
- Test point-in-time restore before launching paid plans.

## Disaster Recovery

- RTO target: 4 hours for app/API restore.
- RPO target: 24 hours until PITR is configured, then 15 minutes.
- Keep payment-provider dashboards accessible to at least two admins.
- If webhooks fail, providers remain source of truth; replay events after resolving failures.

## Remaining Risks

- Live provider contracts, GST/tax treatment, refund handling, and privacy policy wording need legal/accounting review.
- Docker and Vercel builds must be validated in the target production environment.
- E2E payment flows require sandbox credentials not available locally.
- Support impersonation has schema/audit foundations but should remain disabled until the UI requires reason, expiry, and approval.
