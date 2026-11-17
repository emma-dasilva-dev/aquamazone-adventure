import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminAuthConfigured, createAdminSession, verifyAdminPassword } from '../../../../lib/admin-auth';

export const runtime='nodejs';
const attempts=new Map<string,{failures:number;until:number}>();
const WINDOW=15*60*1000;
function sameOrigin(req:NextRequest):boolean {
  const origin=req.headers.get('origin'),host=req.headers.get('host');
  if(!origin||!host)return false;
  try{return new URL(origin).host.toLowerCase()===host.toLowerCase();}catch{return false;}
}
export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return new NextResponse(null,{status:403});
  if(!adminAuthConfigured())return new NextResponse(null,{status:503});
  const client=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unidentified';
  const now=Date.now();
  // Defense in depth only. Production needs a shared IP rate limiter/WAF.
  const record=attempts.get(client);
  if(record && record.until>now && record.failures>=5)return new NextResponse(null,{status:429});
  if(record && record.until<=now)attempts.delete(client);
  if(Number(req.headers.get('content-length')||0)>2048)return new NextResponse(null,{status:413});
  let password='';
  try {
    const form=await req.formData();
    password=String(form.get('password')??'');
  } catch { return new NextResponse(null,{status:400}); }
  if(!verifyAdminPassword(password)){
    const old=attempts.get(client);
    attempts.set(client,{failures:(old?.until && old.until>now ? old.failures:0)+1,until:now+WINDOW});
    return NextResponse.redirect(new URL('/admin/login?error=1',req.url),{status:303});
  }
  attempts.delete(client);
  const response=NextResponse.redirect(new URL('/admin',req.url),{status:303});
  response.cookies.set(ADMIN_COOKIE,createAdminSession(),{
    httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/admin',maxAge:8*60*60
  });
  response.headers.set('Cache-Control','no-store');
  return response;
}
