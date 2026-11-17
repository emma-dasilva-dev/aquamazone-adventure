-- V1.5F: safe single-admin manual intake and immutable change audit.
-- Prerequisites: 0001–0003, and scoped Neon role 'aquamazone_intake'.
-- Only the authenticated server may hold intake credentials. No public DB access.
BEGIN;

ALTER FUNCTION enqueue_reservation_alerts() SECURITY DEFINER;
ALTER FUNCTION enqueue_reservation_alerts() SET search_path TO public, pg_temp;

CREATE OR REPLACE FUNCTION audit_reservation_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $audit$
DECLARE
  event_name text;
  details jsonb;
BEGIN
  IF TG_OP='INSERT' THEN
    event_name:='created';
    details:=jsonb_build_object(
      'status',NEW.status,'paymentStatus',NEW.payment_status,
      'source','administrator_intake'
    );
  ELSIF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    event_name:=CASE WHEN NEW.payment_status='verified' THEN 'payment_verified' ELSE 'note' END;
    details:=jsonb_build_object(
      'previousPaymentStatus',OLD.payment_status,
      'paymentStatus',NEW.payment_status
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    event_name:=CASE NEW.status
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'cancelled' THEN 'cancelled'
      WHEN 'completed' THEN 'completed'
      WHEN 'expired' THEN 'expired'
      WHEN 'awaiting_payment' THEN 'payment_requested'
      ELSE 'reviewed'
    END;
    details:=jsonb_build_object(
      'previousStatus',OLD.status,'status',NEW.status
    );
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO reservation_events(reservation_id,event_type,actor_kind,details)
  VALUES(NEW.id,event_name,'system',details);
  RETURN NEW;
END;
$audit$;

CREATE TRIGGER reservations_audit_created
AFTER INSERT ON reservations FOR EACH ROW
EXECUTE FUNCTION audit_reservation_lifecycle();

CREATE TRIGGER reservations_audit_changed
AFTER UPDATE OF status,payment_status ON reservations FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status OR
  OLD.payment_status IS DISTINCT FROM NEW.payment_status
)
EXECUTE FUNCTION audit_reservation_lifecycle();

-- Neon scoped read_write roles initially have broad table privileges.
-- Limit the intake role to creating a pending inquiry only.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM aquamazone_intake;
GRANT USAGE ON SCHEMA public TO aquamazone_intake;
GRANT INSERT (
  reference,experience,experience_choice,visit_date,requested_time,
  adults,children,quote_amount_xof,contact_name,contact_phone
) ON reservations TO aquamazone_intake;
GRANT SELECT(id,reference) ON reservations TO aquamazone_intake;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  REVOKE ALL ON TABLES FROM aquamazone_intake;
COMMIT;
