import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthenticated } from '../../../../../lib/admin-auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function redirectResult(request:NextRequest, code:string) {
  return NextResponse.redirect(
    new URL('/admin?hold='+encodeURIComponent(code),request.url),
    {status:303,headers:{'Cache-Control':'no-store'}}
  );
}

/**
 * Private administrator-only hold. This never takes money or confirms a booking.
 * A dedicated Postgres role can only execute the limited SECURITY DEFINER function.
 */
export async function POST(request:NextRequest) {
  const origin=request.headers.get('origin');
  const host=request.headers.get('host');
  let allowed=false;
  try {
    allowed=Boolean(origin&&host&&new URL(origin).host.toLowerCase()===host.toLowerCase()
      &&['http:','https:'].includes(new URL(origin).protocol));
  } catch {/* deny */}
  if(!allowed)return new NextResponse(null,{status:403});
  if(!await isAdminAuthenticated())return new NextResponse(null,{status:401});
  if(Number(request.headers.get('content-length')||0)>1024)
    return new NextResponse(null,{status:413});

  const url=process.env.DATABASE_URL_HOLDS;
  if(!url)return redirectResult(request,'not_configured');
  try {
    const parsed=new URL(url);
    if(!['postgres:','postgresql:'].includes(parsed.protocol)||
       parsed.pathname!=='/aquamazone'||parsed.username!=='aquamazone_hold_worker')
      return redirectResult(request,'not_configured');
  } catch {return redirectResult(request,'not_configured');}

  let reference:string;
  try {
    const data=await request.formData();
    reference=String(data.get('reference')??'').trim();
  } catch {return redirectResult(request,'invalid');}
  if(!/^AQ-[0-9]{8}-[0-9A-F]{32}$/.test(reference))
    return redirectResult(request,'invalid');

  try {
    const sql=neon(url);
    const result=await sql`SELECT booking_reference,hold_expires_at::text
      FROM start_private_reservation_hold(${reference})`;
    if(result.length!==1)return redirectResult(request,'failed');
    return redirectResult(request,'created');
  } catch (error) {
    const code=(error as {constraint?:string}).constraint;
    if(code==='reservation_daily_guest_limit'||code==='reservation_daily_count_limit'||
       code==='reservation_slot_guest_limit'||code==='reservation_equipment_unavailable')
      return redirectResult(request,'capacity');
    console.error('[Aquamazone admin] Could not start hold:',error instanceof Error?error.name:'Unknown');
    return redirectResult(request,'failed');
  }
}
