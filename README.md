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
