-- Read-only availability snapshot for an authenticated backend using $1, $2, $3.
-- $1: visit_date (YYYY-MM-DD)
-- $2: activity start time (HH:MM)
-- $3: activity duration in minutes (positive integer)
-- All conversions use Africa/Porto-Novo; no browser timezone dependency.
-- Results are advisory only; booking MUST allocate assets atomically in one
-- database transaction. Do not reveal individual reservation records publicly.
WITH request AS (
  SELECT
    (($1::date + $2::time) AT TIME ZONE 'Africa/Porto-Novo') AS starts_at,
    (($1::date + $2::time) AT TIME ZONE 'Africa/Porto-Novo') + ($3::integer * INTERVAL '1 minute') AS ends_at
  WHERE $3::integer BETWEEN 1 AND 180
),
busy AS (
  SELECT DISTINCT allocation.asset_id
  FROM reservation_allocations allocation
  JOIN request ON allocation.usage_period && tstzrange(request.starts_at,request.ends_at,'[)')
)
SELECT
  equipment_type,
  COUNT(*)::integer AS total_units,
  COUNT(*) FILTER (WHERE busy.asset_id IS NULL)::integer AS available_units
FROM reservation_assets assets
LEFT JOIN busy ON busy.asset_id=assets.id
WHERE assets.active = true
GROUP BY equipment_type
ORDER BY equipment_type;
