# Deploy Gift to your Cloudflare account

This GitHub checkout now targets standalone Cloudflare Workers with Supabase authentication and PostgreSQL storage. The existing Sites deployment and its D1 data are unchanged. No WAF rules or Stripe billing integration are added by this migration.

## 1. Prepare Supabase (required before using the deployed app)

Open your Supabase project → SQL Editor → New query. Paste and run `supabase/migrations/202609270001_gift.sql` once. This creates the budget, setup, reminder and snapshot tables, with user isolation policies and transactional save functions. No database password is required by the app. The secret API key is only needed by the server-side reminder dispatcher; normal user requests use the user's authenticated session and row-level security.

In Authentication → URL Configuration, set Site URL to the actual deployed HTTPS origin. Use your new Worker URL until budgetwithgift.com is attached and active, then update Site URL. Add your deployed origin followed by `/**` to Redirect URLs (currently `https://gift.davidmackasy.workers.dev/**`) so signup and recovery callbacks are permitted. Add `http://localhost:5173/**` only for local testing if needed. Enable the Email provider and email confirmation.

In Authentication → Email Templates use these confirmation link targets:

- Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
- Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

Configure production SMTP for reliable authentication email delivery. Test signup, confirmation, sign-in, password reset and sign-out with your own account before inviting users.

## 2. Create the Cloudflare application

Workers & Pages → Create application → connect `davidmackasy/carry`, branch `main`.

- Name: `gift`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root
- Node version: 22 (also recorded in `.node-version`)
- Disable preview builds for the initial production setup. Later, use a separate Supabase project and runtime secrets for `gift-preview`; `npm run deploy:preview` builds and deploys that environment.

These commands use the pinned Cloudflare Vite plugin and Wrangler integration already in this repository. Do not use the Next.js Vercel preset, overwrite vite.config.ts with an initializer, or run an unpinned alternate deploy package. `npm run deploy:check` validates the built package without publishing.

Local CLI alternative: `npx wrangler login`, then `npm run deploy`. Cloudflare's connected Git build supplies deployment authorization; the account ID alone is not an API credential.

## 3. Configure Worker runtime values

After creation, open the Worker → Settings → Variables and Secrets. Build variables alone are not enough: these values must be available at Worker runtime.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: your Supabase publishable key
- `NEXT_PUBLIC_APP_URL`: the actual HTTPS app origin (Worker URL initially, custom domain after verification)

Required only for email reminders:

- `SUPABASE_SECRET_KEY`: Supabase server secret, stored as a secret
- `RESEND_API_KEY`: secret
- `CARRY_EMAIL_FROM`: verified sender, e.g. Gift with your verified email address
- `CARRY_REMINDER_JOB_SECRET`: a long random secret for the dispatcher

The compatible CARRY_ names avoid changing the existing email adapter. Configure a scheduler to POST `/api/reminders/dispatch` every 15 minutes with `Authorization: Bearer <CARRY_REMINDER_JOB_SECRET>`. The UI reports reminders as unconfigured until a provider and recent successful scheduler run exist.

Local `.env.local` is ignored by Git and does not get uploaded to Cloudflare. Never commit secrets or put server secrets in client-prefixed variables. Use replacement secrets for any previously shared in chat. Stripe values can remain private, but checkout and webhooks are not implemented in this change; do not enable live billing yet.

## 4. Bring over an existing budget

In the original Sites app, open Settings → Export my data. Keep the file privately. Create and confirm your new Supabase account, then visit `/import` in the new app (also linked from Settings and the sign-in page). Review the displayed record counts and import. This replaces only the signed-in account's budget and leaves the original app untouched. Forecast history starts recording in the new deployment; the original export retains the prior history. Sites identities cannot safely be mapped to Supabase users merely by matching an email address, so this migration does not automatically copy or delete live records.

## 5. Domain cutover

Only after login and budget saving work, add budgetwithgift.com as a custom domain for the Worker. The domain is currently attached to Sites, so remove that old binding and replace the old website DNS records as instructed by Cloudflare. Keep email DNS records. Update Supabase Site URL and the Worker's NEXT_PUBLIC_APP_URL after HTTPS is working. Retain the original Sites app until you have verified your imported budget.

## Verification performed locally

- Finance and setup tests, including reminder estimates and email adapter behavior.
- PostgreSQL execution of the migration: two-user isolation, anonymous denial, optimistic save conflicts and transactional deletion.
- TypeScript check, production build, and Wrangler deployment dry run.

Cloudflare publication, real Supabase signup/email delivery, and authenticated end-to-end saving still require the above dashboard configuration. No production database was changed by these local tests.
