# Visitor reviews — Aquamazone Adventure

The public section **Votre aventure, vos mots** appears immediately before the footer. Visitors can write their name, how they discovered Aquamazone, an optional 1–5 rating, and their experience (20–1000 characters). Approved visitor comments are shown to everyone; there are **no fabricated or automatically published testimonials**.

## Database and server setup

- Migration: `db/migrations/0012_visitor_reviews.sql`, installed on the existing Neon `aquamazone` database on 20 November 2026.
- The migration creates `public.visitor_reviews`, public ordering and abuse-throttle indexes, and scoped grants to the existing `aquamazone_intake` PostgreSQL role.
- The server reuses the existing `DATABASE_URL_INTAKE` and `ADMIN_SESSION_SECRET` environment variables. **No new secrets or database credentials are necessary.** Both must remain server-only and present on whichever environment is running the website.
- To run locally, update the Git branch and restart Next.js to load the changed code. For production, deploy that commit and ensure the same existing environment variables are configured.
- If either variable is absent or a database request fails, the site fails closed (no fake success message); no comments are exposed.

## Moderate submissions

1. Log in through the existing `/admin/login` page.
2. Open `/admin/reviews` (also linked from the dashboard).
3. Check each submitted review; approve it to publish it or reject it. You can also retract a previously approved review.

Reviews appear publicly only if `status='approved'`. Neither pending nor rejected comments are returned from the public endpoint.

## Trust and safety

- Reviews are self-reported, **not purchase-verified**; avoid claiming they were verified visits.
- Visitors only supply a public display name, discovery source, optional rating and comment, not a phone number.
- The server validates text lengths, rejects markup and links, uses a honeypot and applies a per-network submission cooldown.
- HMAC IP fingerprints are not visible to clients or site administrators. The HMAC uses purpose-separated ADMIN_SESSION_SECRET; it does not reveal admin credentials.
- Review moderation is protected by the existing administrator session plus same-origin checks.
- Establish a retention period for rejected/old pending reviews and monitor abuse. More advanced bot protection may be required at higher traffic.
