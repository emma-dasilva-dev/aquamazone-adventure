# AQUAMAZONE Adventure — Website

Mobile-first, bilingual Next.js website for Aquamazone Adventure in Adounko, Cotonou, Benin.

## Design and sections

- Photographic hero, vertical activity discovery, premium experience packages and Restaurant & Bar
- Scroll-driven horizontal gallery with **20 photo slots**; current stock photographs are illustrative, **not pictures of Aquamazone**
- Location/directions, opening hours, visitor guidance and accessible FAQ
- Floating visitor assistant with a secure server-side AI integration and WhatsApp handoff
- All development remains on `design/mobile-first`; `main` is not modified

## Run locally

Requires a current supported Node.js version and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Enable conversational AI

The visitor assistant uses `app/api/assistant/route.ts`, `lib/aquamazone-knowledge.ts`, and `lib/visitor-guide.ts` for the non-AI verified fallback. It defaults to the economical `gpt-4.1-mini` model through the OpenAI Responses API.

1. Create `.env.local` locally using `.env.example` as the template.
2. Set `OPENAI_API_KEY` to a valid server-side API key. Never place it in `NEXT_PUBLIC_*` variables or commit it to Git.
3. Optionally set `OPENAI_ASSISTANT_MODEL`.
4. Restart your dev server. Add these settings to your production host before deployment.

Without the key, the assistant uses a clearly labeled **verified information guide** for supported questions and refers unknown matters to WhatsApp. It is not a conversational AI model until a valid key is configured. The web app **does not** book visits, collect payment or check inventory. The assistant cannot confirm availability, a reservation, or MTN MoMo payment.

**Status:** Source integration is complete, but there has been no authenticated live API test; configure a valid key and verify billing/model access. A ChatGPT subscription does not supply an API key or API credits.\n\n**Security status:** API body validation, bounded history, server-only credentials, provider timeout and a best-effort per-process rate limit are implemented. For a public production deployment, add **distributed** rate limiting / a WAF and abuse monitoring; per-process limits are not sufficient across serverless instances. Perform prompt-injection, bilingual and mobile accessibility testing before going live. Responses from an LLM should still be treated as fallible.

## Gallery assets

The 20 gallery entries are in `app/ImmersiveGallery.tsx` in the `slides` array. Update each entry with authorized Aquamazone media, bilingual alt/caption copy, and meaningful labels. The stock images currently used are examples. The GSAP scroll-pinned experience has a reduced-motion fallback.

## Before launch

- Replace all stock photographs with approved real Aquamazone media, including gallery images.
- Verify precise map pin and all displayed rates, especially packages still awaiting business confirmation.
- Complete accessibility, keyboard, low-end mobile, and responsive testing.
- Add production edge/distributed rate limiting, usage alerts and error monitoring.
- Implement secure reservation, phone OTP, MTN MoMo verification and staff booking management separately.

Do not publish the prototype as if its example imagery were official photos or if online bookings were already operational.

## V1.5B — Validated reservation enquiries

The reservation planner now requests server-side validation from `POST /api/reservation/quote` before preparing a WhatsApp message. Shared rules live in `lib/reservation-rules.ts` and cover:

- Current date and booking cutoff in `Africa/Porto-Novo` timezone (no same-day requests)
- Standard Saturday/Sunday slots from 12:00 to 17:00; holidays and weekday groups require direct team contact
- Valid guest counts and exact requirements for GLÈLÈ, GUÉZO, TOFFA, BÉHANZIN and pedal-powered boats
- Indicative FCFA totals, without double-charging the included crossing
- Unknown rates (TOFFA, lake and mangrove) explicitly returned as pending confirmation

**This endpoint does not store customers or reservations, lock inventory, guarantee a time slot, process a payment, or issue a booking reference.** The response explicitly returns `bookingConfirmed: false`, `paymentCollected: false`, and `availabilityChecked: false`. WhatsApp remains the customer-to-staff channel. Do not treat quote responses as proof of availability or payment. A future version needs authenticated staff workflows and durable transactional storage.

## V1.5C — PostgreSQL design and inventory foundation (not yet live)

The PostgreSQL schema lives in `db/migrations/0001_reservations.sql`. It defines:
- `reservation_assets`: actual labeled units for 2 single / 2 double pédalos, 4 single / 4 double canoes, and 2 pedal-powered boats with four seats each
- `reservations`: visit date, guest breakdown, optional unverified contact fields, price and state transitions
- `reservation_allocations`: a PostgreSQL GiST exclusion rule preventing simultaneous allocation of the **same physical unit** to overlapping times
- `reservation_events`: append-only history table for future authorized staff actions

`lib/inventory-allocation.ts` proposes equipment units from a supplied busy-asset snapshot. It treats multi-activity packages and activities with unverified equipment capacity as **manual review**. It supports fixed 30-minute windows for the modeled equipment. The exclusion constraint—not the in-memory planner—is the concurrency safety boundary.

### Run inventory tests

With Node.js 22+ (Node 24 recommended):

```bash
npm run test:inventory
```

### Critical next setup

**The database is not provisioned, connected or migrated by these GitHub commits.** There is no database client dependency in the app yet and no endpoint creates bookings. Do not claim the site checks live availability. The existing quote API and WhatsApp flow remain unchanged.

Before enabling bookings:
1. Provision a private PostgreSQL database with encrypted connections and backups, configure separate migration/runtime users, and apply the migration on the intended database.
2. Create a server-only database connection (never expose the connection string to the browser). Add connection pooling and a proper transactional reservation workflow.
3. Within one transaction, select available equipment, insert the reservation and its allocations, and handle exclusion conflicts gracefully. Release allocations on cancellation/expiration; set bounded hold expiry and verify staff payments before confirmation.
4. Verify real-world inventory, operating restrictions, duration/sequence of each bundled activity, identity/OTP rules, staff roles and cancellation policies with the operator.
5. Only after the above, expose authenticated staff administration and a customer reservation endpoint. Never report a booking as confirmed or paid without an audited authorized action.

No MTN MoMo transaction or booking confirmation occurs in V1.5C.

## V1.5D — Database integration preparation

Added PostgreSQL migration `db/migrations/0002_equipment_lifecycle.sql` and read-only parameterized query `db/queries/equipment-availability.sql`.

The migration provides:
- `occupied_equipment` view for physical units recorded in active allocation rows
- `release_reservation_allocations(uuid)` for clearing allocations **only after** an authorized cancellation or expiry
- Conservative capacity handling: an expired allocation still occupies equipment until transactional cleanup. This avoids falsely advertising availability while the exclusion constraint still blocks it.

The query accepts a date, time and duration. It uses `Africa/Porto-Novo` and computes total versus currently unallocated physical units. This query is a *snapshot*, not a reservation hold; the per-asset GiST exclusion constraint remains the concurrency guard.

**Database setup is required before live usage.** Provision PostgreSQL with TLS, backups and restricted credentials; then apply `0001` followed by `0002` using a migration/owner role. Do not run these migrations against an existing production database without review. Do not use an administrative database login in the public website.

The application intentionally does **not** yet have `DATABASE_URL` or a PostgreSQL connection client: the deployment's database service, credentials, access method and role permissions must be established first. The UI continues to use the existing server-validated WhatsApp enquiry; live availability, stored bookings, and payments are not activated.

Next build step once the database is provisioned: add a pooled server-only PostgreSQL adapter, run migrations, test connectivity and permissions, then implement transactional holds and expiry cleanup, and finally staff-only lifecycle actions. Never enable booking confirmation merely because a read-only availability query reports free equipment.

## Neon provisioning status — 17 November 2026

Neon was connected and an isolated PostgreSQL database named `aquamazone` was created within the existing Neon project `my-first-project` (`old-smoke-56391833`), on its default `production` branch. The initial `neondb` database was left untouched.

- Applied the statements from `db/migrations/0001_reservations.sql` and `0002_equipment_lifecycle.sql` to the **new** `aquamazone` database in one transaction.
- Verified four tables: `reservation_assets`, `reservations`, `reservation_allocations`, `reservation_events`, plus the `occupied_equipment` view.
- Verified the equipment seed contains 14 units: 2 single pédalos, 2 double pédalos, 4 single canoes, 4 double canoes, and 2 four-seat pedal boats.
- Verified the `reservation_allocations_asset_id_usage_period_excl` exclusion constraint exists.
- At provisioning, both reservations and allocations counts were zero.
- Read-only verification SQL: `db/queries/verify-setup.sql`.

**Backend is not yet wired to Neon.** Do not publish a database connection string or copy it to `NEXT_PUBLIC_*`. The existing Next.js application requires a server-only PostgreSQL driver and runtime connection setup. Use a pooled runtime connection, a direct connection for migrations, and a least-privilege database role before implementing any customer write endpoint. The existing `package-lock.json` must be updated along with `package.json` when installing the driver.

**Never turn the public quotation endpoint into a booking-creation endpoint without authentication/OTP, abuse controls, transactional allocation, and payment/state verification.** No paid booking capabilities are enabled yet.

## V1.5D — Next.js read-only Neon adapter

The database is provisioned, and a scoped `aquamazone_app_read` role was created in Neon. Its SELECT access to the inventory was verified. The Next.js server adapter lives at `lib/db/equipment-availability.ts`, using the official `@neondatabase/serverless` HTTP client with parameterized SQL. No database password is stored in this repository.

**Local connection setup:**

1. In the [Neon console](https://console.neon.tech/app/projects/old-smoke-56391833), choose the **production** branch, database **aquamazone**, and role **aquamazone_app_read**. Copy that role's **pooled** connection string; keep it private.
2. Add `DATABASE_URL_READONLY=postgresql://...` to your existing local `.env.local` (do not replace your OpenAI variables). `.env.local` is gitignored.
3. After pulling these commits, run `npm install` once to install the new `@neondatabase/serverless` dependency and refresh `package-lock.json`. The lockfile could not be regenerated in the authoring environment, so it must be refreshed before any `npm ci` or production deployment.
4. Start your local Next.js server and visit `http://localhost:3000/api/internal/database-status`. A successful read-only response shows `connected: true`, `activeEquipmentUnits: 14` and `categories: 5`. It returns 404 in production, does not reveal secrets or identify customers, and does not create a reservation.
5. Add the same **private, read-only** environment variable to your production hosting settings only when enabling a production read feature. Never use `NEXT_PUBLIC_DATABASE_URL_READONLY` or an owner/admin database URL.

**Not yet enabled:** Public live availability, transactional booking creation, payments, confirmation, OTP, and staff dashboard. The existing quote and WhatsApp enquiry workflows continue as before. A second, tightly restricted reservation-writer role must be designed before any write endpoint is introduced.
