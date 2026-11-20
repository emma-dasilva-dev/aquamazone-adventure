import {NextRequest,NextResponse} from 'next/server';
import {createReview,readApprovedReviews,reviewFingerprint,reviewsConfigured,validateReview} from '../../../lib/visitor-reviews';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};

export async function GET(){
 if(!reviewsConfigured())return NextResponse.json({ok:true,enabled:false,reviews:[]},{headers});
 try{return NextResponse.json({ok:true,enabled:true,reviews:await readApprovedReviews()},{headers});}
 catch{return NextResponse.json({ok:false,enabled:false,reviews:[]},{status:503,headers});}
}

export async function POST(request:NextRequest){
 if(!reviewsConfigured())return NextResponse.json({ok:false,code:'unavailable'},{status:503,headers});
 const origin=request.headers.get('origin');
 const host=request.headers.get('host');
 try{
  if(!origin||!host||new URL(origin).host.toLowerCase()!==host.toLowerCase())
   return NextResponse.json({ok:false,code:'origin'},{status:403,headers});
 }catch{return NextResponse.json({ok:false,code:'origin'},{status:403,headers});}
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))
  return NextResponse.json({ok:false,code:'type'},{status:415,headers});
 if(Number(request.headers.get('content-length')||0)>2500)
  return NextResponse.json({ok:false,code:'large'},{status:413,headers});
 let payload:unknown;
 try{const raw=await request.text();if(raw.length>2500)return NextResponse.json({ok:false,code:'large'},{status:413,headers});payload=JSON.parse(raw);}
 catch{return NextResponse.json({ok:false,code:'invalid'},{status:400,headers});}
 const review=validateReview(payload);
 if(!review.ok)return NextResponse.json(review,{status:422,headers});
 // Prefer a platform-asserted client IP; fall back to a stable request metadata fingerprint.
 const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||
          request.headers.get('user-agent')||'unknown';
 try{
  const created=await createReview(review,reviewFingerprint(ip));
  return NextResponse.json(created?{ok:true,status:'pending'}:{ok:false,code:'rate_limit'},{status:created?202:429,headers});
 }catch{return NextResponse.json({ok:false,code:'unavailable'},{status:503,headers});}
}
