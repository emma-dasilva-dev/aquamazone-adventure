-- AQUAMAZONE V1.5C — PostgreSQL foundation (run manually after provisioning PostgreSQL).
-- This migration does NOT expose a public booking endpoint or activate payments.
-- Times are timestamptz; application dates are interpreted in Africa/Porto-Novo.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS reservation_assets (
  id text PRIMARY KEY,
  equipment_type text NOT NULL CHECK (equipment_type IN ('pedalo_single','pedalo_double','canoe_single','canoe_double','pedal_boat')),
  seats smallint NOT NULL CHECK (seats BETWEEN 1 AND 4),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  experience text NOT NULL CHECK (experience IN ('pedalo','canoe','paddle','waterball','pedalboat','lake','mangrove','glele','guezo','toffa','behanzin')),
  experience_choice text CHECK (experience_choice IN ('canoe','pedalo')),
  visit_date date NOT NULL,
  requested_time time without time zone NOT NULL,
  adults smallint NOT NULL CHECK (adults BETWEEN 0 AND 20),
  children smallint NOT NULL CHECK (children BETWEEN 0 AND 20),
  CHECK (adults + children BETWEEN 1 AND 20),
  quote_amount_xof integer CHECK (quote_amount_xof >= 0),
  quote_currency char(3) NOT NULL DEFAULT 'XOF' CHECK (quote_currency = 'XOF'),
  price_confirmed boolean NOT NULL DEFAULT false,
  contact_name text,
  contact_phone text,
  contact_verified_at timestamptz,
  status text NOT NULL DEFAULT 'inquiry'
    CHECK (status IN ('inquiry','pending_review','awaiting_payment','confirmed','cancelled','completed','expired')),
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','verified','failed','refunded')),
  payment_reference text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (status <> 'confirmed' OR payment_status = 'verified'),
  CHECK (status <> 'confirmed' OR contact_verified_at IS NOT NULL),
  CHECK (status <> 'confirmed' OR price_confirmed = true)
);

-- One actual piece of equipment may be allocated to only one active timespan.
-- The database exclusion constraint is concurrency-safe across transactions.
CREATE TABLE IF NOT EXISTS reservation_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  asset_id text NOT NULL REFERENCES reservation_assets(id),
  usage_period tstzrange NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT isempty(usage_period)),
  CHECK (lower_inc(usage_period) AND NOT upper_inc(usage_period)),
  EXCLUDE USING gist (asset_id WITH =, usage_period WITH &&)
);

CREATE INDEX IF NOT EXISTS reservations_visit_date_idx ON reservations(visit_date, requested_time);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reservations_contact_phone_idx ON reservations(contact_phone);
CREATE INDEX IF NOT EXISTS allocations_by_reservation_idx ON reservation_allocations(reservation_id);

-- Immutable history is essential when staff later manage cancellations and payments.
CREATE TABLE IF NOT EXISTS reservation_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK(event_type IN ('created','reviewed','quote_updated','payment_requested','payment_verified','confirmed','cancelled','completed','expired','note')),
  actor_kind text NOT NULL CHECK(actor_kind IN ('system','staff','payment_provider')),
  actor_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservation_events_by_reservation_idx ON reservation_events(reservation_id,occurred_at DESC);

-- Inventory from approved equipment counts. Upsert only for idempotent migration.
INSERT INTO reservation_assets(id,equipment_type,seats) VALUES
 ('PED-S01','pedalo_single',1), ('PED-S02','pedalo_single',1),
 ('PED-D01','pedalo_double',2), ('PED-D02','pedalo_double',2),
 ('CAN-S01','canoe_single',1), ('CAN-S02','canoe_single',1),
 ('CAN-S03','canoe_single',1), ('CAN-S04','canoe_single',1),
 ('CAN-D01','canoe_double',2), ('CAN-D02','canoe_double',2),
 ('CAN-D03','canoe_double',2), ('CAN-D04','canoe_double',2),
 ('PBO-01','pedal_boat',4), ('PBO-02','pedal_boat',4)
ON CONFLICT (id) DO NOTHING;

-- Runtime database user MUST NOT be granted UPDATE payment_status, contact_verified_at
-- or status=confirmed via public routes. Production staff transitions need authenticated
-- server-side authorization, transactional payment verification and an audit trail.
-- Do not grant public/anonymous clients direct table access.
COMMIT;
