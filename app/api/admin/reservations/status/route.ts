import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthenticated } from '../../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['pending_review', 'confirmed', 'cancelled', 'completed']);

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  try { return Boolean(origin && host && new URL(origin).host.toLowerCase() === host.toLowerCase()); }
  catch { return false; }
}
function redirectResult(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL('/admin?status=' + encodeURIComponent(code), request.url),
    { status: 303, headers: { 'Cache-Control': 'no-store' } });
}
function validTransition(from: string, to: string) {
  if (from === 'inquiry') return to === 'pending_review' || to === 'cancelled';
  if (from === 'pending_review') return to === 'confirmed' || to === 'cancelled';
  if (from === 'confirmed') return to === 'completed' || to === 'cancelled';
  return false;
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (!await isAdminAuthenticated()) return new NextResponse(null, { status: 401 });
  if (Number(request.headers.get('content-length') || 0) > 2048) return new NextResponse(null, { status: 413 });
  const url = process.env.DATABASE_URL_INTAKE;
  if (!url) return redirectResult(request, 'not_configured');
  let data: FormData;
  try { data = await request.formData(); } catch { return redirectResult(request, 'invalid'); }
  const reference = String(data.get('reference') || '').trim();
  const nextStatus = String(data.get('status') || '').trim();
  if (!/^AQ-[0-9]{8}-[0-9A-F]{32}$/.test(reference) || !ALLOWED.has(nextStatus))
    return redirectResult(request, 'invalid');
  try {
    const sql = neon(url);
    const rows = await sql`SELECT status FROM reservations WHERE reference = ${reference} FOR UPDATE`;
    if (rows.length !== 1) return redirectResult(request, 'not_found');
    const currentStatus = String(rows[0].status);
    if (!validTransition(currentStatus, nextStatus)) return redirectResult(request, 'transition');
    await sql`UPDATE reservations SET status = ${nextStatus} WHERE reference = ${reference}`;
    return redirectResult(request, 'updated');
  } catch (error) {
    console.error('[Aquamazone admin] Reservation status update failed:', error instanceof Error ? error.name : 'Unknown');
    return redirectResult(request, 'database_error');
  }
}
