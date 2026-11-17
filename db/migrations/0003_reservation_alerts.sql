-- AQUAMAZONE V1.5E: durable two-channel alert outbox.
-- Notifications are queued atomically with reservation events.
-- No external messages are sent by the database itself.
BEGIN;

CREATE TABLE IF NOT EXISTS reservation_notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  event_type text NOT NULL CHECK (event_type IN ('reservation_created','reservation_status_changed','payment_status_changed')),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','accepted','retry','failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  lease_token uuid,
  provider_message_id text,
  last_error text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id,channel)
);
CREATE INDEX IF NOT EXISTS reservation_alerts_due_idx
  ON reservation_notification_outbox(next_attempt_at,created_at)
  WHERE status IN ('pending','retry','sending');
CREATE INDEX IF NOT EXISTS reservation_alerts_reservation_idx
  ON reservation_notification_outbox(reservation_id,created_at DESC);

CREATE OR REPLACE FUNCTION enqueue_reservation_alerts()
RETURNS trigger LANGUAGE plpgsql AS $outbox$
DECLARE
  event_name text;
  notification_event uuid;
  sanitized_payload jsonb;
BEGIN
  IF TG_OP='INSERT' THEN
    event_name:='reservation_created';
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    event_name:='payment_status_changed';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    event_name:='reservation_status_changed';
  ELSE
    RETURN NEW;
  END IF;
  notification_event := gen_random_uuid();
  -- Store only operational metadata, not private phone numbers or payment credentials.
  sanitized_payload := jsonb_build_object(
    'reference', NEW.reference,
    'experience', NEW.experience,
    'visitDate', NEW.visit_date,
    'requestedTime', NEW.requested_time,
    'adults', NEW.adults,
    'children', NEW.children,
    'amountXof', NEW.quote_amount_xof,
    'priceConfirmed', NEW.price_confirmed,
    'reservationStatus', NEW.status,
    'paymentStatus', NEW.payment_status
  );
  INSERT INTO reservation_notification_outbox(event_id,reservation_id,channel,event_type,payload)
  VALUES
    (notification_event,NEW.id,'email',event_name,sanitized_payload),
    (notification_event,NEW.id,'whatsapp',event_name,sanitized_payload);
  RETURN NEW;
END;
$outbox$;

DROP TRIGGER IF EXISTS reservations_notify_created ON reservations;
CREATE TRIGGER reservations_notify_created
AFTER INSERT ON reservations FOR EACH ROW
EXECUTE FUNCTION enqueue_reservation_alerts();

DROP TRIGGER IF EXISTS reservations_notify_changed ON reservations;
CREATE TRIGGER reservations_notify_changed
AFTER UPDATE OF status,payment_status ON reservations FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status OR
  OLD.payment_status IS DISTINCT FROM NEW.payment_status
)
EXECUTE FUNCTION enqueue_reservation_alerts();

-- At most one worker can own a row; retry after lease expires.
CREATE OR REPLACE FUNCTION claim_reservation_alerts(p_limit integer DEFAULT 10, p_channels text[] DEFAULT ARRAY['email','whatsapp'])
RETURNS SETOF reservation_notification_outbox
LANGUAGE plpgsql SECURITY INVOKER AS $claim$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT id FROM reservation_notification_outbox
    WHERE channel = ANY(p_channels)
      AND ((status IN ('pending','retry') AND next_attempt_at <= now())
      OR (status='sending' AND locked_until < now()))
      AND attempt_count < 8
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit,1),20)
  )
  UPDATE reservation_notification_outbox a
  SET status='sending',attempt_count=a.attempt_count+1,
      lease_token=gen_random_uuid(),locked_until=now()+interval '2 minutes',
      updated_at=now()
  FROM due WHERE a.id=due.id
  RETURNING a.*;
END;
$claim$;

-- Lease-token guarded acknowledgement: another worker cannot finish an old lease.
CREATE OR REPLACE FUNCTION finish_reservation_alert(
  p_id uuid, p_lease uuid, p_accepted boolean, p_provider_id text, p_error text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $finish$
DECLARE changed integer;
BEGIN
  UPDATE reservation_notification_outbox
  SET status=CASE WHEN p_accepted THEN 'accepted'
                  WHEN attempt_count>=8 THEN 'failed' ELSE 'retry' END,
      accepted_at=CASE WHEN p_accepted THEN now() ELSE NULL END,
      provider_message_id=CASE WHEN p_accepted THEN left(coalesce(p_provider_id,''),255) ELSE NULL END,
      last_error=CASE WHEN p_accepted THEN NULL ELSE left(coalesce(p_error,'Delivery failed'),400) END,
      next_attempt_at=CASE WHEN p_accepted THEN next_attempt_at
        ELSE now()+LEAST(3600,30*power(2,LEAST(attempt_count,7))) * interval '1 second' END,
      lease_token=NULL,locked_until=NULL,updated_at=now()
  WHERE id=p_id AND lease_token=p_lease AND status='sending';
  GET DIAGNOSTICS changed=ROW_COUNT;
  RETURN changed=1;
END;
$finish$;
COMMIT;
