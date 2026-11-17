-- V1.5I — Transaction-safe booking capacity enforcement.
-- Does not enable payment, confirm a booking, or change an existing enquiry.
-- Only confirmed reservations and non-expired payment holds consume capacity.
BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_reservation_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  policy public.reservation_capacity_policy%ROWTYPE;
  daily_count integer;
  daily_guests integer;
  slot_guests integer;
  requested_guests integer;
BEGIN
  IF NOT (
    NEW.status='confirmed'
    OR (NEW.status='awaiting_payment' AND NEW.expires_at>statement_timestamp())
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.status='awaiting_payment' AND NEW.expires_at IS NULL THEN
    RAISE EXCEPTION 'Payment hold requires an expiration time'
      USING ERRCODE='23514',CONSTRAINT='reservation_hold_expiry_required';
  END IF;

  -- Every capacity-consuming transition takes the SAME row lock.
  -- Concurrent transactions cannot both pass using stale aggregate counts.
  SELECT * INTO STRICT policy
  FROM public.reservation_capacity_policy
  WHERE id=1 FOR UPDATE;

  requested_guests:=NEW.adults+NEW.children;
  SELECT count(*)::integer,
         coalesce(sum(r.adults+r.children),0)::integer,
         coalesce(sum(r.adults+r.children) FILTER (
           WHERE r.requested_time=NEW.requested_time
         ),0)::integer
  INTO daily_count,daily_guests,slot_guests
  FROM public.reservations r
  WHERE r.visit_date=NEW.visit_date
    AND r.id IS DISTINCT FROM NEW.id
    AND (
      r.status='confirmed'
      OR (r.status='awaiting_payment' AND r.expires_at>statement_timestamp())
    );

  IF daily_count+1>policy.daily_reservations THEN
    RAISE EXCEPTION 'Daily reservation limit reached'
      USING ERRCODE='23514',CONSTRAINT='reservation_daily_count_limit';
  END IF;
  IF daily_guests+requested_guests>policy.daily_visitors THEN
    RAISE EXCEPTION 'Daily visitor limit reached'
      USING ERRCODE='23514',CONSTRAINT='reservation_daily_guest_limit';
  END IF;
  IF slot_guests+requested_guests>policy.slot_visitors THEN
    RAISE EXCEPTION 'Arrival slot visitor limit reached'
      USING ERRCODE='23514',CONSTRAINT='reservation_slot_guest_limit';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservation_capacity_guard ON public.reservations;
CREATE TRIGGER reservation_capacity_guard
BEFORE INSERT OR UPDATE OF
  visit_date,requested_time,adults,children,status,expires_at
ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.enforce_reservation_capacity();

-- Non-expiring payment holds are invalid, including ones inserted by a trusted writer.
ALTER TABLE public.reservations
  ADD CONSTRAINT awaiting_payment_requires_expiry
  CHECK (status <> 'awaiting_payment' OR expires_at IS NOT NULL);

COMMIT;
