# Aquamazone — MTN MoMo Collections integration

Status: **foundation only — not live and not accepting payments**.

## Official MTN flow
1. Aquamazone obtains a merchant Collections account for Benin and the production credentials.
2. MTN's production gateway is `https://proxy.momoapi.mtn.com`,
   target `mtnbenin`, currency `XOF`. Sandbox uses
   `https://sandbox.momodeveloper.mtn.com`, target `sandbox` and test currency `EUR`.
3. Server gets a bearer token from `POST /collection/token/`, then sends
   `POST /collection/v1_0/requesttopay` with a unique UUID in `X-Reference-Id`.
4. HTTP 202 means **queued / pending**, never paid.
5. Server reconciles using authenticated `GET /collection/v1_0/requesttopay/{uuid}`.
   MTN callbacks must not by themselves confirm payment; they trigger reconciliation.
   Callbacks may only be delivered once, so a polling/reconciliation fallback is required.

Official documentation:
- https://momodeveloper.mtn.com/
- https://momoapi.mtn.com/
- https://momodevelopercommunity.mtn.com/how-to-59/momo-api-production-configuration-101
- https://momodeveloper.mtn.com/content/html_widgets/nqxho.html

## Already implemented
- `lib/payments/mtn-momo.ts`: server-only Collections adapter, explicit environment
  allowlist, token issuance, RequestToPay and authenticated provider-status polling.
- `lib/payments/payment-status.ts`: strict XOF/amount/payer/external-reference matching.
- `db/migrations/0011_mtn_payment_intents.sql`: payment-intent ledger and append-only
  event records, with **no payment write role granted**.
- `tests/payment-status.test.ts`: verification and mismatch cases.

## Deliberately NOT implemented/activated
- No public checkout API, no live payment button, no automatic confirmation.
- No callback HTTP route. MTN callbacks do not have an assumed trusted signature.
- No database role with payment write permissions, no auto-execution of migrations.
- No card, Moov, Kkiapay or third-party aggregator.

## Required before taking any customer money
1. MTN confirms Benin merchant onboarding, credentials, account settlement,
   callback registration and any production API restrictions.
2. Set the secret variables locally/at deployment; **never commit credentials**.
3. Validate sandbox token and RequestToPay flows separately using MTN test currency
   and test MSISDNs; sandbox results must never update real XOF orders.
4. Build a server-priced checkout flow: create immutable payment intent inside a
   transaction, lock reservation/restaurant inventory, and bind intent to its order.
5. Implement a restricted payment worker that reconciles MTN's authenticated status
   by the original UUID; transition paid + order confirmed **atomically**, only if
   reference, amount, currency, payer, and merchant order all match.
6. Make retries idempotent. A network timeout must remain uncertain until status
   reconciliation; never create a second charge by blindly retrying.
7. Reconcile missed callbacks, pending payments and failures; build cancellation,
   hold-expiry, refund/manual intervention procedures and comprehensive audit logs.
8. Security review, abuse/rate-limit checks, and production end-to-end testing.

### Environment
```ini
MTN_MOMO_ENABLED=false
MTN_MOMO_ENVIRONMENT=sandbox
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_CALLBACK_URL=
```
The current adapter intentionally rejects real XOF payment calls under `sandbox`.
No customer-facing route calls the adapter, even when the env switch is enabled.

Run local pure verification tests:
```bash
node --experimental-strip-types --test tests/payment-status.test.ts
```
