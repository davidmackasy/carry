# Gift branding and domain rollout

The product is Gift. Its tagline is “Give every dollar a purpose.” Its primary domain is https://budgetwithgift.com.

Updated app wordmarks, onboarding, reminder settings, Advisor label, installation and deletion copy, export filename, reminder email copy, metadata, favicon, home-screen icons, manifest and offline shell. The approved layout and financial calculations are unchanged.

## Domain activation

The domain is attached to the existing Sites project and awaits DNS verification. At the DNS provider add these records (some providers expect only the host label):

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 162.159.143.30 |
| A | @ | 172.66.3.26 |
| TXT | _openai-site-verification | Retrieve the verification value from Sites domain settings |
| TXT | _cf-custom-hostname | Retrieve the verification value from Sites domain settings |

Check existing records before replacing any conflicting website records. Preserve mail records. Once DNS and SSL are verified, set NEXT_PUBLIC_APP_URL=https://budgetwithgift.com in the deployment environment. Local development may use its local origin. Until then, operational email links retain the working hosted origin; canonical and sharing metadata already identify the new domain. Authentication redirects remain relative to the current origin.

## Compatibility exceptions

Existing CARRY_EMAIL_FROM, CARRY_REMINDER_JOB_SECRET and CARRY_APP_URL environment names remain supported to avoid breaking deployment configuration. NEXT_PUBLIC_APP_URL takes precedence over the legacy origin. Set the sender display name to Gift when configuring a verified email sender; no unverified mailbox is assumed.

Internal carry component paths, CSS classes, the Carry component symbol, get_carry_summary tool identifier, repository name, source checkout name, and the existing hosted URL remain compatible. These are not visible product branding. Database tables, user IDs, stored financial records, historical delivery records and PWA identity/scope are unchanged. The shell cache version changes to refresh install assets.

## Existing integration scope

The current app uses Sites authentication and D1 storage. Supabase and Stripe are not integrated in this source; no Stripe products, prices, subscriptions or webhooks were created or changed. Password reset and verification screens are provider-controlled. No legal pages, analytics project, sitemap or public marketing pages existed to rename. Email delivery requires a configured provider and scheduler.

Social sharing title and description are updated. Image generation was blocked by the image service usage limit; no social preview image is configured pending the requested generated asset.
