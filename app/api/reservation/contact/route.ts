import {NextRequest,NextResponse} from 'next/server';
import {
  CONTACT_COOKIE,channelConfigured,verificationConfigured,normalizeDestination,
  generateCode,hashed,newContactSession,validContactSession,
  verificationDb,sendContactCode,type ContactChannel
} from '../../../../lib/contact-verification';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const HEADERS={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};

function respond(data:object,status=200){
  return NextResponse.json(data,{status,headers:HEADERS});
}
function sameOrigin(req:NextRequest):boolean{
  const origin=req.headers.get('origin'),host=req.headers.get('host');
  try{
    if(!origin||!host)return false;
    const value=new URL(origin);
    return (value.protocol==='https:'||value.protocol==='http:')&&value.host.toLowerCase()===host.toLowerCase();
  }catch{return false;}
}

export async function GET(){
  return respond({
    ok:true,
    available:{
      email:channelConfigured('email'),
      whatsapp:channelConfigured('whatsapp')
    },
    paymentEnabled:false
  });
}

/** Two independent contact ownership challenges, scoped to one HttpOnly session. */
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return respond({ok:false,code:'origin_rejected'},403);
  if(Number(request.headers.get('content-length')||0)>1024)
    return respond({ok:false,code:'too_large'},413);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return respond({ok:false,code:'invalid_type'},415);
  let data:Record<string,unknown>;
  try{
    const raw=await request.text();
    if(raw.length>1024)return respond({ok:false,code:'too_large'},413);
    const parsed:unknown=JSON.parse(raw);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
      return respond({ok:false,code:'invalid_request'},400);
    data=parsed as Record<string,unknown>;
  }catch{return respond({ok:false,code:'invalid_json'},400);}

  const action=data.action;
  const channel=data.channel;
  if(action!=='send'&&action!=='verify'&&action!=='status')
    return respond({ok:false,code:'invalid_action'},400);
  if(channel!=='email'&&channel!=='whatsapp')
    return respond({ok:false,code:'invalid_channel'},400);
  const safeChannel=channel as ContactChannel;
  const destination=normalizeDestination(safeChannel,data.destination);
  if(!destination)return respond({ok:false,code:'invalid_destination'},422);
  if(!verificationConfigured())return respond({ok:false,code:'not_configured'},503);
  if(action==='send'&&!channelConfigured(safeChannel))
    return respond({ok:false,code:'provider_not_configured'},503);

  let session=request.cookies.get(CONTACT_COOKIE)?.value;
  if(action!=='send'&&!validContactSession(session))
    return respond({ok:true,verified:false});

  const newSession=action==='send'&&!validContactSession(session);
  if(newSession)session=newContactSession();
  if(!validContactSession(session))return respond({ok:false,code:'session_invalid'},400);

  const sessionKey=hashed('session',session);
  const destinationKey=hashed('destination',safeChannel,destination);
  let sql:ReturnType<typeof verificationDb>;
  try{sql=verificationDb();}catch{return respond({ok:false,code:'not_configured'},503);}

  if(action==='status'){
    try{
      const rows=await sql`SELECT public.reservation_contact_verified(
        ${sessionKey},${safeChannel},${destinationKey}
      ) AS verified`;
      return respond({ok:true,verified:rows[0]?.verified===true});
    }catch{return respond({ok:false,code:'verification_unavailable'},503);}
  }

  if(action==='verify'){
    const code=data.code;
    if(typeof code!=='string'||!/^\d{6}$/.test(code))
      return respond({ok:false,code:'invalid_code'},422);
    const codeKey=hashed('code',session,safeChannel,destination,code);
    try{
      const rows=await sql`SELECT public.check_reservation_contact_code(
        ${sessionKey},${safeChannel},${destinationKey},${codeKey}
      ) AS verified`;
      if(rows[0]?.verified!==true)return respond({ok:false,code:'code_incorrect_or_expired'},422);
      return respond({ok:true,verified:true});
    }catch{return respond({ok:false,code:'verification_unavailable'},503);}
  }

  // 'send' — rate limits are enforced centrally in Neon, not in memory.
  const code=generateCode();
  const codeKey=hashed('code',session,safeChannel,destination,code);
  const clientAddress=(request.headers.get('x-real-ip')||
    request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,128);
  const ipKey=hashed('ip',clientAddress);
  try{
    await sql`SELECT public.issue_reservation_contact_code(
      ${sessionKey},${safeChannel},${destinationKey},${codeKey},${ipKey}
    ) AS issued`;
  }catch{
    return respond({ok:false,code:'wait_or_rate_limited'},429);
  }
  const delivered=await sendContactCode(safeChannel,destination,code);
  if(!delivered){
    try{await sql`SELECT public.fail_reservation_contact_delivery(
      ${sessionKey},${safeChannel},${codeKey}
    )`;}catch{/* Safe: failed delivery never verifies an address. */}
    return respond({ok:false,code:'delivery_unavailable'},503);
  }
  const response=respond({ok:true,code:'code_requested',expiresInSeconds:300});
  if(newSession)response.cookies.set(CONTACT_COOKIE,session,{
    httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',
    maxAge:3600,path:'/'
  });
  return response;
}
