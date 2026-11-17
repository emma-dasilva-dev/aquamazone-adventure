import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthenticated } from '../../../../lib/admin-auth';
import { validateAdminExperienceSelection } from '../../../../lib/admin-experience-selection';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function sameOrigin(req:NextRequest){
  const origin=req.headers.get('origin'),host=req.headers.get('host');
  try{return !!origin && !!host && new URL(origin).host.toLowerCase()===host.toLowerCase();}catch{return false;}
}
function go(req:NextRequest, result:string) {
  return NextResponse.redirect(new URL('/admin?intake='+encodeURIComponent(result),req.url),{status:303,headers:{'Cache-Control':'no-store'}});
}

/** Single-administrator intake; records an UNCONFIRMED inquiry only. */
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return new NextResponse(null,{status:403});
  if(!await isAdminAuthenticated())return new NextResponse(null,{status:401});
  if(Number(request.headers.get('content-length')||0)>4096)return new NextResponse(null,{status:413});
  const url=process.env.DATABASE_URL_INTAKE;
  if(!url)return go(request,'not_configured');
  let db:ReturnType<typeof neon>;
  try{
    const parsed=new URL(url);
    if(!['postgres:','postgresql:'].includes(parsed.protocol)||parsed.pathname!=='/aquamazone')
      return go(request,'not_configured');
    db=neon(url);
  }catch{return go(request,'not_configured');}
  let form:FormData;
  try{form=await request.formData();}catch{return go(request,'invalid');}
  const name=String(form.get('contactName')||'').trim().replace(/\s+/g,' ');
  const phone=String(form.get('contactPhone')||'').trim();
  if(name.length<2||name.length>100||/[\x00-\x1f\x7f]/.test(name)||
     !/^[+0-9 ()-]{8,24}$/.test(phone))return go(request,'invalid');
  const selectionResult=validateAdminExperienceSelection({
    activities:form.getAll('activities'),
    package:String(form.get('package')??'').trim()||null,
    choice:form.get('choice'),
    date:form.get('date'),
    time:form.get('time'),
    adults:Number(form.get('adults')),
    children:Number(form.get('children'))
  });
  if(!selectionResult.ok)return go(request,selectionResult.code);
  const {primary,selection,quoteAmount}=selectionResult;
  // The legacy experience column records the first selection; the structured
  // JSON field is authoritative for full multi-activity or forfait details.
  const structuredSelection=JSON.stringify(selection);
  // Random 128-bit reference; any uniqueness conflict fails closed and can be retried.
  const reference='AQ-'+primary.date.replaceAll('-','')+'-'+randomBytes(16).toString('hex').toUpperCase();
  try{
    await db`INSERT INTO reservations
      (reference,experience,experience_choice,visit_date,requested_time,adults,children,quote_amount_xof,contact_name,contact_phone,experience_selection)
      VALUES (
        ${reference},${primary.experience},${primary.choice??null},
        ${primary.date}::date,${primary.time}::time,${primary.adults},
        ${primary.children},${quoteAmount},${name},${phone},${structuredSelection}::jsonb
      )`;
    // PostgreSQL triggers write the audit event and BOTH alert jobs in the same transaction.
    // Do NOT confirm payment or allocate equipment during admin intake.
    return go(request,'created');
  }catch{
    return go(request,'database_error');
  }
}
