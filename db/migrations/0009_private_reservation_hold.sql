-- V1.5J — Private 10-minute equipment + capacity hold for supported simple enquiries.
-- No public execution. No payment operation. Contact verification is NOT performed here.
BEGIN;

CREATE OR REPLACE FUNCTION public.start_private_reservation_hold(p_reference text)
RETURNS TABLE(booking_reference text,hold_expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp
AS $hold$
DECLARE
  r public.reservations%ROWTYPE;
  kind text;
  seats_needed integer;
  a record;
  available_asset text;
  period tstzrange;
  local_today date;
BEGIN
  IF p_reference IS NULL OR length(p_reference)>100 THEN
    RAISE EXCEPTION 'Invalid reference' USING ERRCODE='22023';
  END IF;

  -- Consistent lock order with reservation capacity trigger.
  PERFORM 1 FROM public.reservation_capacity_policy WHERE id=1 FOR UPDATE;
  SELECT * INTO r FROM public.reservations WHERE reference=p_reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found' USING ERRCODE='P0002'; END IF;
  IF r.status='awaiting_payment' AND r.expires_at>clock_timestamp() THEN
    RETURN QUERY SELECT r.reference,r.expires_at;
    RETURN;
  END IF;
  IF r.status NOT IN ('inquiry','pending_review') THEN
    RAISE EXCEPTION 'Only an unconfirmed enquiry may start a hold' USING ERRCODE='22023';
  END IF;
  local_today:=(clock_timestamp() AT TIME ZONE 'Africa/Porto-Novo')::date;
  IF r.visit_date<=local_today OR extract(isodow from r.visit_date)::integer NOT IN (6,7) THEN
    RAISE EXCEPTION 'Automatic holds require a future weekend visit' USING ERRCODE='22023';
  END IF;
  IF r.quote_amount_xof IS NULL OR r.quote_amount_xof<=0
     OR r.contact_name IS NULL OR trim(r.contact_name)=''
     OR r.contact_phone IS NULL OR trim(r.contact_phone)='' THEN
    RAISE EXCEPTION 'Manual pricing or contact review is required' USING ERRCODE='22023';
  END IF;
  IF r.experience_selection IS NOT NULL
    AND (jsonb_array_length(coalesce(r.experience_selection->'activities','[]'::jsonb))>0
      AND (r.experience_selection->>'package') IS NOT NULL) THEN
    RAISE EXCEPTION 'Combined experiences require manual scheduling' USING ERRCODE='22023';
  END IF;
  IF r.experience_selection IS NOT NULL
     AND jsonb_array_length(coalesce(r.experience_selection->'activities','[]'::jsonb))>1 THEN
    RAISE EXCEPTION 'Multiple activities require manual scheduling' USING ERRCODE='22023';
  END IF;

  seats_needed:=r.adults+r.children;
  IF r.experience='glele' AND seats_needed=1 THEN
    IF r.experience_choice NOT IN ('canoe','pedalo') THEN
      RAISE EXCEPTION 'GLÈLÈ requires one selected activity' USING ERRCODE='22023';
    END IF;
    kind:=CASE r.experience_choice WHEN 'canoe' THEN 'canoe_single' ELSE 'pedalo_single' END;
  ELSIF r.experience IN ('canoe','pedalo') AND seats_needed BETWEEN 1 AND 2 THEN
    kind:=r.experience||CASE WHEN seats_needed=1 THEN '_single' ELSE '_double' END;
  ELSIF r.experience='pedalboat' AND seats_needed BETWEEN 2 AND 4 THEN
    kind:='pedal_boat';
  ELSE
    RAISE EXCEPTION 'Activity requires manual equipment scheduling' USING ERRCODE='22023';
  END IF;

  -- Remove previously expired physical holds before checking the exclusion constraint.
  -- The capacity trigger ignores expired holds immediately, even before cleanup.
  DELETE FROM public.reservation_allocations alloc
  USING public.reservations old
  WHERE alloc.reservation_id=old.id
    AND old.status='awaiting_payment'
    AND old.expires_at<=clock_timestamp();
  UPDATE public.reservations
     SET status='expired',updated_at=clock_timestamp()
   WHERE status='awaiting_payment' AND expires_at<=clock_timestamp();

  period:=tstzrange(
    (r.visit_date+r.requested_time) AT TIME ZONE 'Africa/Porto-Novo',
    ((r.visit_date+r.requested_time) AT TIME ZONE 'Africa/Porto-Novo') + interval '30 minutes',
    '[)'
  );
  FOR a IN
    SELECT id FROM public.reservation_assets
    WHERE active=true AND equipment_type=kind
    ORDER BY id
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.reservation_allocations alloc
      WHERE alloc.asset_id=a.id AND alloc.usage_period && period
    ) THEN
      available_asset:=a.id;
      EXIT;
    END IF;
  END LOOP;
  IF available_asset IS NULL THEN
    RAISE EXCEPTION 'No compatible equipment available for that slot'
      USING ERRCODE='23514',CONSTRAINT='reservation_equipment_unavailable';
  END IF;
  UPDATE public.reservations
  SET status='awaiting_payment',
      expires_at=clock_timestamp()+interval '10 minutes',
      updated_at=clock_timestamp()
  WHERE id=r.id;
  INSERT INTO public.reservation_allocations(reservation_id,asset_id,usage_period)
  VALUES(r.id,available_asset,period);
  RETURN QUERY SELECT r.reference,
    (SELECT expires_at FROM public.reservations WHERE id=r.id);
END;
$hold$;

REVOKE ALL ON FUNCTION public.start_private_reservation_hold(text) FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM aquamazone_hold_worker;
GRANT USAGE ON SCHEMA public TO aquamazone_hold_worker;
GRANT EXECUTE ON FUNCTION public.start_private_reservation_hold(text) TO aquamazone_hold_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  REVOKE ALL ON TABLES FROM aquamazone_hold_worker;
COMMIT;
