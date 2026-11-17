import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '../../../../lib/admin-auth';

export async function POST(req:NextRequest) {
  const host=req.headers.get('host'),origin=req.headers.get('origin');
  let allowed=false;
  try{allowed=!!host && !!origin && new URL(origin).host.toLowerCase()===host.toLowerCase();}catch{}
  if(!allowed)return new NextResponse(null,{status:403});
  const response=NextResponse.redirect(new URL('/admin/login',req.url),{status:303});
  response.cookies.set(ADMIN_COOKIE,'',{path:'/admin',maxAge:0,httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production'});
  response.headers.set('Cache-Control','no-store');
  return response;
}
