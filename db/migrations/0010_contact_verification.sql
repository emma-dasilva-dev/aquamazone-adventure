-- AQUAMAZONE: contact ownership verification, no payments or automatic booking.
-- Values are HMAC-SHA256 hashes; no email, phone or OTP is stored in these tables.
BEGIN;

CREATE TABLE IF NOT EXISTS reservation_contact_challenges (
  session_key text NOT NULL CHECK (session_key ~ '^[0-9a-f]{64}$'),
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  destination_key text NOT NULL CHECK (destination_key ~ '^[0-9a-f]{64}$'),
  code_key text NOT NULL CHECK (code_key ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  PRIMARY KEY(session_key,channel)
);

CREATE TABLE IF NOT EXISTS reservation_contact_send_limits (
  limiter_key text PRIMARY KEY CHECK (limiter_key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count smallint NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.issue_reservation_contact_code(
  p_session text,p_channel text,p_destination text,p_code text,p_ip text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp AS $fn$
DECLARE existing record; limiter text; usage_count integer; max_count integer;
BEGIN
  IF p_channel NOT IN ('email','whatsapp') OR
     p_session !~ '^[0-9a-f]{64}$' OR p_destination !~ '^[0-9a-f]{64}$' OR
     p_code !~ '^[0-9a-f]{64}$' OR p_ip !~ '^[0-9a-f]{64}$'
  THEN RAISE EXCEPTION 'Invalid verification arguments' USING ERRCODE='22023'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_session||':'||p_channel,0));
  SELECT last_sent_at INTO existing FROM public.reservation_contact_challenges
  WHERE session_key=p_session AND channel=p_channel FOR UPDATE;
  IF FOUND AND existing.last_sent_at>clock_timestamp()-interval '60 seconds' THEN
    RAISE EXCEPTION 'Wait before requesting another code'
      USING ERRCODE='P0001';
  END IF;

  -- Per-destination (4/hour), per-session (8/hour), per-IP (20/hour) limits.
  FOR limiter,max_count IN
    SELECT 'destination:'||p_destination,4
    UNION ALL SELECT 'session:'||p_session,8
    UNION ALL SELECT 'ip:'||p_ip,20
  LOOP
    INSERT INTO public.reservation_contact_send_limits(limiter_key,window_start,request_count)
    VALUES(encode(digest(limiter,'sha256'),'hex'),clock_timestamp(),1)
    ON CONFLICT (limiter_key) DO UPDATE
    SET request_count=CASE WHEN reservation_contact_send_limits.window_start<clock_timestamp()-interval '1 hour'
                           THEN 1 ELSE reservation_contact_send_limits.request_count+1 END,
        window_start=CASE WHEN reservation_contact_send_limits.window_start<clock_timestamp()-interval '1 hour'
                          THEN clock_timestamp() ELSE reservation_contact_send_limits.window_start END
    RETURNING request_count INTO usage_count;
    IF usage_count>max_count THEN
      RAISE EXCEPTION 'Verification request limit reached' USING ERRCODE='P0001';
    END IF;
  END LOOP;

  INSERT INTO public.reservation_contact_challenges
    (session_key,channel,destination_key,code_key,expires_at,last_sent_at,verified_at,attempts)
  VALUES(p_session,p_channel,p_destination,p_code,
         clock_timestamp()+interval '5 minutes',clock_timestamp(),NULL,0)
  ON CONFLICT(session_key,channel) DO UPDATE
  SET destination_key=EXCLUDED.destination_key,code_key=EXCLUDED.code_key,
      expires_at=EXCLUDED.expires_at,last_sent_at=EXCLUDED.last_sent_at,
      verified_at=NULL,attempts=0;
  RETURN true;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.check_reservation_contact_code(
  p_session text,p_channel text,p_destination text,p_code text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp AS $fn$
DECLARE record_value public.reservation_contact_challenges%ROWTYPE;
BEGIN
  IF p_channel NOT IN ('email','whatsapp') OR
     p_session !~ '^[0-9a-f]{64}$' OR p_destination !~ '^[0-9a-f]{64}$' OR
     p_code !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  SELECT * INTO record_value FROM public.reservation_contact_challenges
   WHERE session_key=p_session AND channel=p_channel FOR UPDATE;
  IF NOT FOUND OR record_value.destination_key<>p_destination OR
     record_value.expires_at<=clock_timestamp() OR record_value.attempts>=5 OR
     record_value.verified_at IS NOT NULL THEN RETURN false; END IF;
  IF record_value.code_key=p_code THEN
    UPDATE public.reservation_contact_challenges
       SET verified_at=clock_timestamp()
       WHERE session_key=p_session AND channel=p_channel;
    RETURN true;
  END IF;
  UPDATE public.reservation_contact_challenges
    SET attempts=LEAST(5,attempts+1)
    WHERE session_key=p_session AND channel=p_channel;
  RETURN false;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reservation_contact_verified(
  p_session text,p_channel text,p_destination text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=public,pg_temp AS $fn$
  SELECT EXISTS(
    SELECT 1 FROM public.reservation_contact_challenges
    WHERE session_key=p_session AND channel=p_channel AND destination_key=p_destination
      AND verified_at IS NOT NULL AND verified_at>now()-interval '1 hour'
  );
$fn$;

-- Recovery when an external provider refuses the message. Never expose code hashes to clients.
CREATE OR REPLACE FUNCTION public.fail_reservation_contact_delivery(
  p_session text,p_channel text,p_code text
) RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path=public,pg_temp AS $fn$
  UPDATE public.reservation_contact_challenges
     SET expires_at=clock_timestamp(),last_sent_at=clock_timestamp()-interval '61 seconds'
  WHERE session_key=p_session AND channel=p_channel AND code_key=p_code
    AND verified_at IS NULL;
$fn$;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM aquamazone_contact_verify;
GRANT USAGE ON SCHEMA public TO aquamazone_contact_verify;
REVOKE ALL ON FUNCTION public.issue_reservation_contact_code(text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_reservation_contact_code(text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reservation_contact_verified(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_reservation_contact_delivery(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_reservation_contact_code(text,text,text,text,text) TO aquamazone_contact_verify;
GRANT EXECUTE ON FUNCTION public.check_reservation_contact_code(text,text,text,text) TO aquamazone_contact_verify;
GRANT EXECUTE ON FUNCTION public.reservation_contact_verified(text,text,text) TO aquamazone_contact_verify;
GRANT EXECUTE ON FUNCTION public.fail_reservation_contact_delivery(text,text,text) TO aquamazone_contact_verify;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM aquamazone_contact_verify;
COMMIT;
