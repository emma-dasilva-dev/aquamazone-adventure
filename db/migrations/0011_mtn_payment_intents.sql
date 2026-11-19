-- AQUAMAZONE / MTN Collections: payment intent ledger (NOT activation).
-- Apply manually AFTER the existing reservation migrations.
-- No web route or role is granted access to payment writes by this migration.
BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL UNIQUE,
  external_id text NOT NULL UNIQUE
    CHECK (external_id ~ '^[A-Za-z0-9_-]{1,80}$'),
  purpose text NOT NULL CHECK (purpose IN ('activity_reservation','restaurant_preorder')),
  -- Reservation UUID or future restaurant order UUID; no generic FK is assumed.
  purpose_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'mtn_momo'
    CHECK (provider='mtn_momo'),
  currency char(3) NOT NULL DEFAULT 'XOF' CHECK (currency='XOF'),
  amount_xof integer NOT NULL CHECK (amount_xof>0),
  payer_msisdn text NOT NULL CHECK (payer_msisdn ~ '^22901[0-9]{8}$'),
  state text NOT NULL DEFAULT 'created'
    CHECK (state IN ('created','pending','paid','failed','reconciliation_required')),
  provider_transaction_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state <> 'paid' OR provider_transaction_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS payment_intents_purpose_idx
  ON public.payment_intents(purpose,purpose_id);
CREATE INDEX IF NOT EXISTS payment_intents_open_idx
  ON public.payment_intents(state,created_at)
  WHERE state IN ('created','pending','reconciliation_required');

CREATE TABLE IF NOT EXISTS public.payment_intent_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  intent_id uuid NOT NULL REFERENCES public.payment_intents(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN (
    'created','submitted','provider_pending','provider_paid',
    'provider_failed','provider_mismatch','network_uncertain','reconciled'
  )),
  provider_status text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

-- No edits/deletes to audit events, including by an operator.
CREATE OR REPLACE FUNCTION public.reject_payment_event_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Payment events are immutable';
END;
$$;
DROP TRIGGER IF EXISTS payment_intent_events_immutable ON public.payment_intent_events;
CREATE TRIGGER payment_intent_events_immutable
BEFORE UPDATE OR DELETE ON public.payment_intent_events
FOR EACH ROW EXECUTE FUNCTION public.reject_payment_event_mutation();

-- Keep schema inaccessible to anon, intake, readonly, holds, alert and OTP roles.
-- A dedicated, narrowly scoped payment worker/function is required in a later migration.
REVOKE ALL ON public.payment_intents FROM PUBLIC;
REVOKE ALL ON public.payment_intent_events FROM PUBLIC;
COMMIT;
