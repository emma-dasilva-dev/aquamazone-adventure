import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated} from '../../../../lib/admin-auth';
import {moderateReview,readModerationQueue,reviewsConfigured} from '../../../../lib/visitor-reviews';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function GET(){
 if(!await isAdminAuthenticated())return NextResponse.json({ok:false,code:'unauthorized'},{status:401,headers});
 if(!reviewsConfigured())return NextResponse.json({ok:false,code:'not_configured'},{status:503,headers});
 try{return NextResponse.json({ok:true,reviews:await readModerationQueue()},{headers});}
 catch{return NextResponse.json({ok:false,code:'unavailable'},{status:503,headers});}
}
export async function PATCH(request:NextRequest){
 if(!await isAdminAuthenticated())return NextResponse.json({ok:false,code:'unauthorized'},{status:401,headers});
 const origin=request.headers.get('origin'),host=request.headers.get('host');
 try{if(!origin||!host||new URL(origin).host.toLowerCase()!==host.toLowerCase())return NextResponse.json({ok:false,code:'origin'},{status:403,headers});}
 catch{return NextResponse.json({ok:false,code:'origin'},{status:403,headers});}
 if(!reviewsConfigured())return NextResponse.json({ok:false,code:'not_configured'},{status:503,headers});
 let data:unknown;
 try{const raw=await request.text();if(raw.length>500)return NextResponse.json({ok:false},{status:413,headers});data=JSON.parse(raw);}
 catch{return NextResponse.json({ok:false,code:'invalid'},{status:400,headers});}
 const value=data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:{};
 if(typeof value.id!=='string'||!/^[-0-9a-f]{36}$/i.test(value.id)||(value.status!=='approved'&&value.status!=='rejected'))
  return NextResponse.json({ok:false,code:'invalid'},{status:422,headers});
 try{return NextResponse.json({ok:await moderateReview(value.id,value.status)},{headers});}
 catch{return NextResponse.json({ok:false,code:'unavailable'},{status:503,headers});}
}
