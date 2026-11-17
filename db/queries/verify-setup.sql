-- AQUAMAZONE — read-only post-migration verification.
-- Run against the dedicated 'aquamazone' PostgreSQL database.
-- No customer records are created or changed.
SELECT equipment_type, COUNT(*)::integer AS units, SUM(seats)::integer AS total_seats
FROM reservation_assets
GROUP BY equipment_type ORDER BY equipment_type;

SELECT
  (SELECT COUNT(*)::integer FROM reservation_assets WHERE active) AS active_assets,
  (SELECT COUNT(*)::integer FROM reservations) AS reservations,
  (SELECT COUNT(*)::integer FROM reservation_allocations) AS allocations;

SELECT conname AS exclusion_constraint
FROM pg_constraint
WHERE conrelid = 'reservation_allocations'::regclass AND contype = 'x';

SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'reservation%'
ORDER BY table_name;
