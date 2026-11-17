-- Upgrade notifications to report full multi-activity / optional-forfait selection.
-- Applied after 0005. Non-destructive replacement preserves existing triggers.
CREATE OR REPLACE FUNCTION enqueue_reservation_alerts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $outbox$
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
    'experienceSelection', NEW.experience_selection,
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
