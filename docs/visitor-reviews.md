# Visitor reviews setup

The public website section **Votre aventure, vos mots** comes after reservations, before the footer. It intentionally starts with **no fake testimonials**. A visitor may leave a display name, how they discovered Aquamazone, an optional rating, and a comment.

All submissions enter the database as **pending**. Only **approved** comments appear publicly. Approve or reject from **/admin/reviews** using the existing private administrator login.

## Activation

1. In the dedicated PostgreSQL database `aquamazone`, run `db/migrations/0012_visitor_reviews.sql` once. Use your normal controlled migration workflow.
2. Create a *dedicated restricted* role that can SELECT and INSERT `visitor_reviews`, and UPDATE only `status` and `approved_at`. Do not use your database owner or expose credentials through `NEXT_PUBLIC_`.
3. Set `DATABASE_URL_REVIEWS` to that role's pooled Neon connection URL. Set `REVIEW_RATE_LIMIT_SECRET` to a distinct 32+-character random value. Configure both in `.env.local` for development and in the deployed environment.
4. Restart or redeploy. Open **/admin/login** then **/admin/reviews** to moderate submissions.

Until both environment values and the migration are present, the form shows **“Le formulaire d’avis sera bientôt disponible.”** No visitor review is falsely reported as submitted.

## Operational policy

- Entries are **not** testimonials verified by purchase or visit; do not describe them as verified guests.
- Moderators should remove abusive, defamatory, identifying or promotional content; do not rewrite customer opinions to create misleading praise.
- Names are display names only; never request phone numbers.
- A pseudonymous HMAC fingerprint of network metadata is retained for abuse throttling; rotate the secret on an appropriate retention schedule and set a data retention period for pending/rejected entries.
- A one-hour network cooldown and link filter reduce basic spam; production traffic may require a provider-side challenge and monitoring.
- The public API does not expose pending, rejected, or fingerprint data.
