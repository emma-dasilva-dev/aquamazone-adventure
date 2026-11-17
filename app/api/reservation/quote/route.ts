import { NextRequest, NextResponse } from 'next/server';
import { validateReservation } from '../../../lib/reservation-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };

/**
 * Stateless validation/estimate endpoint. NOT a reservation, availability hold
 * or payment endpoint. Database-backed availability comes in a later milestone.
 */
export async function POST(request: NextRequest) {
  const origin=request.headers.get('origin');
  const host=request.headers.get('host');
  let accepted=false;
  try {
    if(origin && host) {
      const u=new URL(origin);
      accepted=(u.protocol==='https:'||u.protocol==='http:')&&u.host.toLowerCase()===host.toLowerCase();
    }
  } catch { /* invalid origin */ }
  if(!accepted) return NextResponse.json({ok:false,code:'origin_rejected'}, {status:403,headers});
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return NextResponse.json({ok:false,code:'invalid_type'}, {status:415,headers});
  const declaredLength=Number(request.headers.get('content-length')||0);
  if(declaredLength>2048) return NextResponse.json({ok:false,code:'too_large'}, {status:413,headers});
  let body: unknown;
  try {
    const raw=await request.text();
    if(raw.length>2048) return NextResponse.json({ok:false,code:'too_large'}, {status:413,headers});
    body=JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ok:false,code:'invalid_json'}, {status:400,headers});
  }
  const result=validateReservation(body);
  if(!result.ok) return NextResponse.json(result, {status:422,headers});
  return NextResponse.json({
    ...result,
    message:'Indicative estimate only. Contact the team to verify availability and confirm a booking.'
  },{headers});
}
