-- Weekly capacity policy: each Sunday at 00:00 Africa/Porto-Novo starts
-- a new 7-day allocation window. Keep existing daily and per-slot safeguards.
-- Does not change past reservations and does not activate any payments.
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
  week_start date;
  week_count integer;
  week_guests integer;
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

  -- Sunday-to-Saturday local calendar window. No rows are ever reset or deleted:
  -- each reservation belongs to its own visit week; next Sunday's window
  -- naturally begins at zero unless it already has future reservations.
  week_start:=NEW.visit_date-EXTRACT(DOW FROM NEW.visit_date)::integer;
  SELECT COUNT(*)::integer,COALESCE(SUM(r.adults+r.children),0)::integer
  INTO week_count,week_guests
  FROM public.reservations r
  WHERE r.visit_date>=week_start AND r.visit_date<week_start+7
    AND r.id IS DISTINCT FROM NEW.id
    AND (r.status='confirmed'
      OR (r.status='awaiting_payment' AND r.expires_at>statement_timestamp()));
  IF week_count+1>policy.daily_reservations THEN
    RAISE EXCEPTION 'Weekly reservation limit reached'
      USING ERRCODE='23514',CONSTRAINT='reservation_weekly_count_limit';
  END IF;
  IF week_guests+requested_guests>policy.daily_visitors THEN
    RAISE EXCEPTION 'Weekly visitor limit reached'
      USING ERRCODE='23514',CONSTRAINT='reservation_weekly_guest_limit';
  END IF;

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


COMMIT;
