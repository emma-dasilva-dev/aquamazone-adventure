import 'server-only';
import { neon } from '@neondatabase/serverless';

/**
 * Read-only runtime access to the dedicated Aquamazone database.
 * Set DATABASE_URL_READONLY to the pooled URL of aquamazone_app_read.
 * Never expose it through NEXT_PUBLIC_ environment variables.
 */
function sqlClient() {
  const url = process.env.DATABASE_URL_READONLY;
  if (!url) throw new Error('Aquamazone read-only database is not configured.');
  const parsed = new URL(url);
  if (!['postgres:','postgresql:'].includes(parsed.protocol) || parsed.pathname !== '/aquamazone') {
    throw new Error('Expected the dedicated aquamazone PostgreSQL database.');
  }
  return neon(url);
}

export type AvailableEquipment = {
  equipmentType: 'pedalo_single'|'pedalo_double'|'canoe_single'|'canoe_double'|'pedal_boat';
  totalUnits: number;
  availableUnits: number;
};

/**
 * Snapshot only. A successful response does NOT hold inventory or guarantee
 * an eventual booking; transactional allocation must enforce the exclusion constraint.
 */
export async function equipmentAvailability(input: {
  date: string;
  time: string;
  durationMinutes: number;
}): Promise<AvailableEquipment[]> {
  const { date, time, durationMinutes } = input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) ||
      !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
    throw new Error('Invalid availability window.');
  }
  const sql = sqlClient();
  const rows = await sql`
    WITH requested AS (
      SELECT
        ((${date}::date + ${time}::time) AT TIME ZONE 'Africa/Porto-Novo') AS starts_at,
        ((${date}::date + ${time}::time) AT TIME ZONE 'Africa/Porto-Novo')
          + (${durationMinutes}::integer * INTERVAL '1 minute') AS ends_at
    ),
    busy AS (
      SELECT DISTINCT allocations.asset_id
      FROM reservation_allocations AS allocations
      CROSS JOIN requested
      WHERE allocations.usage_period &&
        tstzrange(requested.starts_at, requested.ends_at, '[)')
    )
    SELECT
      assets.equipment_type,
      COUNT(*)::integer AS total_units,
      COUNT(*) FILTER (WHERE busy.asset_id IS NULL)::integer AS available_units
    FROM reservation_assets AS assets
    LEFT JOIN busy ON busy.asset_id = assets.id
    WHERE assets.active = true
    GROUP BY assets.equipment_type
    ORDER BY assets.equipment_type
  `;
  return rows.map(row => ({
    equipmentType: String(row.equipment_type) as AvailableEquipment['equipmentType'],
    totalUnits: Number(row.total_units),
    availableUnits: Number(row.available_units)
  }));
}

export type ReservationCapacity = {
  dailyVisitors: number;
  dailyReservations: number;
  slotVisitors: number;
  limitVisitors: number;
  limitReservations: number;
  limitSlotVisitors: number;
};

/** Read-only confirmed/active-hold totals, with no public reservation details. */
export async function reservationCapacity(input: {date:string;time:string}):Promise<ReservationCapacity> {
  const {date,time}=input;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))
    throw new Error('Invalid capacity window');
  const sql=sqlClient();
  const rows=await sql`
    SELECT policy.daily_visitors AS limit_visitors,
           policy.daily_reservations AS limit_reservations,
           policy.slot_visitors AS limit_slot_visitors,
           COALESCE(SUM(usage.reservation_count),0)::integer AS daily_reservations,
           COALESCE(SUM(usage.visitor_count),0)::integer AS daily_visitors,
           COALESCE(SUM(usage.visitor_count) FILTER (WHERE usage.requested_time=${time}::time),0)::integer AS slot_visitors
    FROM reservation_capacity_policy AS policy
    LEFT JOIN reservation_capacity_usage AS usage ON usage.visit_date=${date}::date
    WHERE policy.id=1
    GROUP BY policy.daily_visitors,policy.daily_reservations,policy.slot_visitors
  `;
  if(rows.length!==1)throw new Error('Capacity policy is unavailable');
  const r=rows[0];
  return {
    dailyVisitors:Number(r.daily_visitors),
    dailyReservations:Number(r.daily_reservations),
    slotVisitors:Number(r.slot_visitors),
    limitVisitors:Number(r.limit_visitors),
    limitReservations:Number(r.limit_reservations),
    limitSlotVisitors:Number(r.limit_slot_visitors)
  };
}
