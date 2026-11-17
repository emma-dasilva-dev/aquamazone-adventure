import { NextResponse } from 'next/server';
import { equipmentAvailability } from '../../../../lib/db/equipment-availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Local development only. This route is intentionally unavailable on deployed
 * production builds and never returns credentials or individual bookings.
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }
  if (!process.env.DATABASE_URL_READONLY) {
    return NextResponse.json(
      { connected: false, reason: 'DATABASE_URL_READONLY is not configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  try {
    // A distant weekend date for a schema/connection smoke check, not a hold.
    const units = await equipmentAvailability({
      date: '2030-01-05', time: '12:00', durationMinutes: 30
    });
    return NextResponse.json({
      connected: true,
      database: 'aquamazone',
      activeEquipmentUnits: units.reduce((total, row) => total + row.totalUnits, 0),
      categories: units.length,
      note: 'Read-only database check; no booking or availability guarantee.'
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Do not leak driver errors, URLs, usernames or passwords.
    return NextResponse.json(
      { connected: false, reason: 'Database connection or schema check failed' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
