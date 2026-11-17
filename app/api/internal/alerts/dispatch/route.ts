import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { dispatchAlerts } from '../../../../lib/notifications/dispatch';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function authorized(request:NextRequest):boolean {
  const key=process.env.ALERT_CRON_SECRET;
  const auth=request.headers.get('authorization');
  if(!key || key.length<32 || !auth?.startsWith('Bearer '))return false;
  const a=Buffer.from(auth.slice(7),'utf8');
  const b=Buffer.from(key,'utf8');
  return a.length===b.length && timingSafeEqual(a,b);
}

export async function GET(req:NextRequest) {
  if(!authorized(req))return new NextResponse(null,{status:401,headers:{'Cache-Control':'no-store'}});
  try{
    const result=await dispatchAlerts();
    return NextResponse.json(result,{
      status:result.configured?200:503,
      headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
    });
  }catch{
    // Do not leak DB/provider credentials or customer data via a cron response.
    return NextResponse.json({error:'dispatch_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
