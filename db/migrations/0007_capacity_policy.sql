-- V1.5H — Capacity policy for future verified reservations.
-- Initial values approved: 70 visitors/day, 40 reservations/day, 10 arrivals/slot.
-- Policy does NOT yet authorize public checkout or allocate equipment.
BEGIN;
CREATE TABLE IF NOT EXISTS reservation_capacity_policy (
  id smallint PRIMARY KEY CHECK (id = 1),
  daily_visitors integer NOT NULL CHECK (daily_visitors BETWEEN 1 AND 10000),
  daily_reservations integer NOT NULL CHECK (daily_reservations BETWEEN 1 AND 10000),
  slot_visitors integer NOT NULL CHECK (slot_visitors BETWEEN 1 AND 10000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO reservation_capacity_policy(id,daily_visitors,daily_reservations,slot_visitors)
VALUES (1,70,40,10)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE VIEW reservation_capacity_usage AS
SELECT r.visit_date, r.requested_time,
       COUNT(*)::integer AS reservation_count,
       COALESCE(SUM(r.adults+r.children),0)::integer AS visitor_count
FROM reservations r
WHERE r.status='confirmed'
   OR (r.status='awaiting_payment' AND r.expires_at>now())
GROUP BY r.visit_date,r.requested_time;

GRANT SELECT ON reservation_capacity_policy TO aquamazone_app_read;
GRANT SELECT ON reservation_capacity_usage TO aquamazone_app_read;
-- No insert/update rights are granted to the enquiry intake or notification worker.
COMMIT;
