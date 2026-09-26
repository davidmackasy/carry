# Gift: subscription and Supabase launch plan

Research date: September 25, 2026. Proposal, not activated pricing. USD / US web launch assumed until confirmed.

## Recommendation

One paid plan, **Gift**, with the same features at **$5.99 monthly** or **$49.99 annually**. Annual billing works out to $4.17/month, paid as one $49.99 charge, saving $21.89 (30.5%) against twelve monthly payments. Present both clearly; do not disguise the upfront annual charge as a monthly payment.

Offer a **30-day trial without a card**, starting when onboarding is completed. This lets users see a paycheck/bill cycle before buying. After the trial, require an explicit checkout to subscribe. Never auto-charge a no-card trial. Keep viewing existing records, export, deletion, and billing management available after expiration; pause new budget edits and premium automation until renewed. Cancel at period end with continued access through the paid-through date. Send an annual-renewal reminder. No lifetime deal or permanent founding discount until costs and retention are measured.

This is a price hypothesis, not a proven optimum. It fits a focused manual money planner below mature products with bank connectivity. Do not claim that Gift saves a particular amount or that subscription revenue is profit.

## Competitive reference points

| Product | Monthly | Annual | Context |
| --- | ---: | ---: | --- |
| YNAB | $14.99 | $109 | 34-day no-card trial; bank imports and household sharing |
| Goodbudget Premium | $10 | $80 | Envelope budgeting plus bank sync |
| Monarch Core | $14.99 | $99.99 | Broader connected-finance product |
| Gift proposal | $5.99 | $49.99 | Guided setup, manual spending, upcoming-event calendar, forecasts and goals |

Primary sources: [YNAB pricing](https://www.ynab.com/pricing), [Goodbudget signup](https://goodbudget.com/signup), [Goodbudget Premium announcement](https://goodbudget.com/blog/2024/08/changes-to-goodbudgets-plan-offerings/). Standard prices, excluding taxes/promotions. Monarch Core prices verified in its [subscription management documentation](https://help.monarch.com/hc/en-us/articles/44815447567636-Updating-Your-Subscription).

## What the one plan includes

Launch with all current budgeting features together: guided setup and saved drafts, multiple estimated incomes, payday/bill countdowns, manual accounts and transactions, categories/splits, recurring bills, goals, purchase scenarios, calculation-based Advisor, history and export. Email reminders belong in this plan **only once delivery works end to end**. Current Advisor is deterministic; do not advertise generative AI. Current PWA has an offline shell, not full offline budget synchronization.

Do not launch separate feature tiers or charge extra for basic reminders. Do not market bank connections, receipt scans, voice, or generative advice as available. Later receipt OCR should launch with a measured allowance (initial hypothesis: 30 scans/month, no rollover), a review-before-save flow, image limits and private retention policy. Determine the final allowance from actual provider costs; do not promise unlimited AI or scanning at this price. Bank-sync economics need separate review before inclusion.

## Illustrative unit economics

Using Stripe US domestic-card standard processing (2.9% + $0.30) and pay-as-you-go Billing (0.7% of billing volume):

| Cadence | Gross payment | Estimated Stripe fees | Net before operating costs |
| --- | ---: | ---: | ---: |
| Monthly | $5.99 | $0.52 | $5.47/month |
| Annual | $49.99 | $2.10 | $47.89/year (~$3.99/month) |

Calculations rounded for planning. Excludes tax tools, taxes collected/remitted, international cards, FX, refunds, disputes, email, hosting, support, acquisition, OCR/LLM and founder labor. Stripe account country and negotiated rates may differ. [Payments pricing](https://stripe.com/pricing), [Billing pricing](https://stripe.com/billing/pricing).

Supabase Pro starts at $25/month, including compute credits sufficient for one Micro project. That alone is covered by roughly five monthly subscribers or seven annual subscribers on a monthly-equivalent basis; **that is not overall business break-even**. A hypothetical $75/month infrastructure budget needs about 14 monthly or 19 annual subscribers before support and acquisition. Validate those costs rather than treating $75 as a vendor quote. [Supabase pricing](https://supabase.com/pricing).

Track trial-to-paid conversion, month-two retention, cancellation reasons, annual share, per-active-user service costs and support time. Reassess after 50–100 paying users and at least two renewal cycles. Start with this one price rather than changing several variables at once.

## Current storage versus target

Gift already persists data: the private Sites app uses Cloudflare D1, user-scoped financial documents, draft setup, daily snapshots and email delivery records. Supabase is a migration, not the first storage layer. The GitHub copy includes existing D1 migrations so the present app remains reproducible.

Recommended target: Supabase Auth for app identities, Postgres with owner-scoped RLS for budget records, and private Supabase Storage buckets for future receipts. Stripe owns payment methods, invoices and subscription billing; Supabase stores customer/subscription references and access state. Never store card numbers in Gift.

The present Sites identity is not a Supabase auth UUID. Do not cast it into one or silently match ownership solely by email. Require authenticated account linking and a recorded mapping from legacy identity to new auth user. Export, validate, and compare source/target totals before changing the storage backend. Keep D1 intact for rollback; no migration or deletion has been performed.

## Implementation sequence

1. **Provision development services.** Create/select a Supabase development project and Stripe test account. Supply project URL and publishable key through environment configuration; keep Supabase service credentials and Stripe secret/webhook keys server-only. Never commit real secrets. Choose the production region and account country before live setup.
2. **Identity and storage.** Add Supabase sign-in/session validation, password reset, verified email and account linking. Introduce a repository interface around finance, draft, snapshot, reminder and deletion operations. Replace direct D1 access consistently, including reminder dispatch; switching only the finance route would split user data between stores.
3. **Schema and migration.** Use auth-owned profiles, accounts, income schedules, received-income occurrences, bills and paid occurrences, categories, transactions/splits, goals, planned purchases, snapshots, setup drafts and reminder preferences. Store integer cents and date-only schedules; use timestamptz for audit times. Use unique occurrence keys, foreign keys and atomic RPCs for deposit/payment recording and optimistic revision checks. RLS must require `auth.uid() = user_id`; cross-user references need ownership constraints. Billing and delivery records are writable only by trusted server operations. Test two real test users and anonymous access. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
4. **Stripe checkout.** Create one Product with monthly and annual recurring Prices, initially test-mode only. Server accepts an interval enum and maps it to approved Price IDs; never accepts an arbitrary price or customer ID from the browser. Create/reuse the authenticated user's customer. Check active subscriptions to avoid duplicate checkouts. Use hosted Checkout and Customer Portal for payment methods, invoices, cancellation and cadence changes. Trial is tracked in the app for no-card onboarding; do not accidentally add another trial when purchasing.
5. **Webhooks and access.** Verify raw-body Stripe signatures. Persist event IDs for retry safety; handle duplicates and out-of-order delivery by reconciling the current subscription from Stripe. Handle subscription create/update/delete, paid invoices and payment failures, including async payment outcomes if enabled. Entitlements come from verified server state, never a success-page URL. Do not equate a checkout-completed event with settled payment in every payment-method flow. Cancellation retains access until the paid-through date. A short, communicated payment-retry grace period can avoid abruptly locking out users. See [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks).
6. **Email and receipts.** Connect a verified sender and a scheduled reminder dispatcher before advertising reminders. For receipt storage use a private bucket, owner-only policies, short-lived signed access and deletion with the account. Do not upload receipt contents to OCR providers without an explicit product disclosure/consent flow. See [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
7. **Launch checks.** Test successful/failed payments, annual and monthly renewals, cancellation, duplicate subscriptions, webhook replay, no-card trial expiration, data export after expiration, account deletion with an active subscription, midnight/timezone transitions and migration rollback. Ensure private Sites gateway access permits Stripe's signed webhook to reach its specific endpoint without weakening authentication on other routes. Public customer signup needs a separate deliberate hosting/audience decision; this repo being public does not make the hosted app public.

## Needed before activation

- Supabase project and secure environment configuration.
- Stripe account country, test credentials, approved prices, webhook endpoint and portal settings.
- Confirmation of USD launch pricing/trial policy before live products or charging.
- Verified email sender and scheduler.

No Supabase connection, live Stripe products, checkout, billing enforcement, data migration, or customer charges are activated by this document. The deployed app remains on its existing storage and auth while the migration is prepared.
