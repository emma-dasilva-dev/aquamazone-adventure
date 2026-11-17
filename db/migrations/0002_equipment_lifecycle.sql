-- V1.5D groundwork: availability read model for staff/server use only.
-- Execute AFTER 0001_reservations.sql in a privately provisioned PostgreSQL database.
-- This script does not grant any public database access.
BEGIN;

-- Cancellations/expirations must delete allocations transactionally, otherwise
-- the exclusion constraint would block the equipment indefinitely.
CREATE OR REPLACE FUNCTION release_reservation_allocations(p_reservation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  released integer;
BEGIN
  -- Caller MUST authenticate and authorize staff actions before invoking.
  PERFORM 1 FROM reservations WHERE id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation does not exist';
  END IF;
  IF EXISTS (SELECT 1 FROM reservations WHERE id=p_reservation_id AND status NOT IN ('cancelled','expired')) THEN
    RAISE EXCEPTION 'Reservation must be cancelled or expired before release';
  END IF;
  DELETE FROM reservation_allocations WHERE reservation_id=p_reservation_id;
  GET DIAGNOSTICS released = ROW_COUNT;
  RETURN released;
END;
$$;

-- A narrow read-only view of occupied physical units. Do not expose the
-- reservation tables themselves to anonymous callers.
CREATE OR REPLACE VIEW occupied_equipment AS
SELECT
  a.asset_id,
  r.visit_date,
  a.usage_period,
  r.id AS reservation_id,
  r.status
FROM reservation_allocations a
JOIN reservations r ON r.id=a.reservation_id
JOIN reservation_assets e ON e.id=a.asset_id
WHERE e.active = true;
-- Conservative by design: every persisted allocation occupies its unit until
-- explicitly removed in a transaction, including after a hold expires.

-- Keep the exclusion constraint in 0001 as the authoritative concurrency
-- control: the view only reports occupancy and is NOT a booking lock.
COMMIT;
