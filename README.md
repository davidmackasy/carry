# Gift

**Standalone Cloudflare deployment:** follow [the deployment guide](docs/cloudflare-deployment.md). This GitHub version uses Supabase Auth and storage. Historical Sites instructions below describe the original hosted app, not the new deployment.


A working manual-budgeting PWA built with TypeScript, React, Next.js-compatible Vinext, and Tailwind. This first deployment runs privately on Sites with authenticated, user-scoped D1 storage.

## Working flows

- Guided onboarding before first use: starting cash, work/employer, estimated take-home pay and real pay dates, housing, selected common bills, spending, optional goals, reminder preferences, and a final review. Partial progress saves to the signed-in account. Existing budgets can rerun setup.
- Home: deterministic daily cash-flow forecast (180-day cap), protected cash buffer, bill/goal reserves, safe spending, activity, weekly summary.
- Spending: editable buckets and budget periods; transactions with category, splits, exclusions, recurring label, note, and balance adjustment.
- Bills: recurring monthly/weekly/biweekly/yearly schedules, subscriptions, payment recording, paused bills, overdue reserves, financial calendar.
- Goals: creation/editing, savings recording, monthly contributions, completion estimates, contribution scenarios.
- Purchase simulation and planned purchases; payday allocation planner; manual accounts and income.
- Advisor: deterministic answers built from financial services. No LLM arithmetic or unconnected AI controls.
- In-app calculated notification center, granular category settings, data export and deletion.
- Installable manifest/icons, safe-area navigation, service worker, offline fallback.
- One daily snapshot per signed-in visit date, refreshed on financial edits; sample data is clearly marked and never becomes the user's budget automatically.

## Architecture

- `services/finance`: pure functions, integer cents, UTC date-only arithmetic; shared by server routes and interactive previews.
- `lib/store.ts`: prepared statements with server-derived user IDs, revision-based conflict protection, daily snapshots.
- `app/api/finance`: authenticated, same-origin, validated writes and owned data deletion.
- `app/api/advisor`: calculation-based answers from the signed-in user's records.
- `features`: Home, Spending, Bills, Goals, Advisor, onboarding.
- `services/banking/provider.ts`: provider interface for a future server-only bank integration.

## Scope and production gaps

This is the first manual MVP, not a completed implementation of every item in the PRD. Sites authentication and SQLite/D1 are used for the private working deployment. A Supabase project was not provided; PostgreSQL tables/RLS, email/password, Google, and Apple authentication are not connected. The current datastore stores a validated per-user financial document plus separate daily snapshots and deletion audit events. It is not the PRD's normalized PostgreSQL schema.

No bank sync, LLM provider, receipt uploads, voice, background jobs/push notifications, automatic transfers, shared budgets, or receipt OCR. Recurring transaction labels do not automatically debit accounts. Financial data is intentionally not cached in browser storage; an offline shell and currently loaded screen work, but refreshing offline cannot show the last dashboard. Snapshots are recorded on visits/edits, not by an unattended scheduled job. Historical analytics and advanced attribution of runway changes are not implemented. Amounts are USD. Budget periods are explicit and manually editable. Goal balances are treated as held outside available spending accounts.

Before a public financial-product launch: connect the intended Supabase deployment and identity providers, migrate to normalized ownership-constrained records/RLS, add complete transaction/account audit history, background recurrence reconciliation, and a security review. Authenticated Sites headers are trusted only behind the hosting dispatcher; do not deploy this server directly to an untrusted public origin without equivalent header isolation.

## Commands

The standard environment uses Node 22.13+ and npm.

```sh
npm run install:ci
npm run dev
node --experimental-strip-types --test tests/finance.test.mjs
npx tsc --noEmit
npm run build
```

`tests/api-test.mjs` checks the local test profile created through UI onboarding. It expects a named `Test budget` with the PRD values; it does not apply to production accounts. Local sign-in is provided by the starter dev server.

## Validation performed

- Financial scenarios: runway thresholds, post-payday simulation, early insolvency, monthly date clamping, purchase purity, split/excluded spending, bill parsing, goal caps, overdue bills.
- Private local API: unauthenticated denial, schema validation, cross-origin rejection, revision conflicts, saved onboarding/goal reload, Advisor response.
- Browser: 390px Home and fixed bottom navigation, no horizontal overflow, seven-step onboarding, confirmed bill entry, goal creation and saving.
- WebMCP: read-only summary returns the visible budget; invalid input rejects.

## Payday and email reminders

Home → Payday & bill reminders controls lead time (default two days before payday and three before bills), local delivery hour, and email opt-in. Payday & income manages estimates and records actual deposits separately; a confirmed deposit is not projected again. In-app reminders include the estimated paycheck and upcoming bills. No employer or bank verification is implied.

Email delivery is implemented but disabled until deployment configuration is supplied. Configure server-side secrets `RESEND_API_KEY` and `CARRY_REMINDER_JOB_SECRET`, plus `CARRY_EMAIL_FROM` with a verified Resend sender. `CARRY_APP_URL` is the application origin. Never put keys in client code. See `.env.example`. A scheduler must POST to `/api/reminders/dispatch` every 15 minutes with `Authorization: Bearer <CARRY_REMINDER_JOB_SECRET>` and the Sites gateway credential when required for this private site. No scheduler or email provider has been connected in this deployment.

Recipients come only from the authenticated account email and explicit email opt-in. The dispatcher respects the user's timezone and hour, persists delivery claims, and uses Resend idempotency keys for retries. It freezes the retry message, avoids retrying beyond the provider's 24-hour idempotency window, and checks opt-out again before sending. Delivery status is shown as active only after a recent successful scheduler heartbeat and configured sender. [Resend idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys).

Run `node tests/run-setup-tests.mjs` for guided setup, reminders, receipt accounting, custom twice-monthly dates, and mocked email delivery checks. Tests do not send email.

## Mobile onboarding and forecast clarity

Setup now presents short cards inside seven chapters, with per-card validation, saved slide position, back navigation, and expandable review sections. Existing saved drafts without a slide index resume at the first card of their saved chapter. Bill selection and bill payment details are separate cards. Reduced-motion settings disable card transitions.

The forecast horizon remains 180 days. “180+” means no protected-buffer breach was found in that window; it is not an exact depletion date or an unlimited-spending promise. Purchase scenarios now follow the selected future purchase date and display projected cash on that day plus the lowest cushion above the protected buffer, even when both runway labels are capped. Safe spending can remain unchanged when the category allowance is the binding limit. Receipt OCR remains planned; no scanning or automatic categorization is represented as available.

Home now leads with the nearest unpaid bill or expected paycheck, prioritizing overdue bills and bills on tied dates. Paid and received occurrences leave the queue. The local-date countdown refreshes while open and on focus; the long-range forecast is collapsed under View cash-flow forecast.

## Supabase and subscriptions

See [the subscription research and migration plan](docs/subscription-and-storage-plan.md). Proposed pricing is not activated; this snapshot still uses the working Sites/D1 backend.
