import { NextRequest, NextResponse } from 'next/server';
import { validateReservation, validateActivitySelection } from '../../../../lib/reservation-rules';
import { validateBookingContact } from '../../../../lib/booking-contact';
import { validatePlan } from '../../../../lib/reservation-plan';

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
  const contact=validateBookingContact(body);
  if(!contact.ok) return NextResponse.json(
    {ok:false,code:contact.code,field:contact.field},
    {status:422,headers}
  );
  if(body && typeof body==='object' && !Array.isArray(body) && 'mode' in body && 'lines' in body){
    const plan=validatePlan(body);
    if(!plan.ok)return NextResponse.json(plan,{status:422,headers});
    return NextResponse.json({ok:true,quote:plan.quote,contactVerification:'not_verified',message:'This is an unconfirmed enquiry; no booking or payment has occurred.'},{headers});
  }
  const result=(body && typeof body==='object' && !Array.isArray(body) && 'activities' in body)
    ?validateActivitySelection(body)
    :validateReservation(body);
  if(!result.ok) return NextResponse.json(result, {status:422,headers});
  return NextResponse.json({
    ...result,
    contactVerification:'not_verified',
    message:'Contact details are provided but NOT OTP-verified. This is an unconfirmed WhatsApp enquiry; no payment is collected.'
  },{headers});
}
