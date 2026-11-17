import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'aquamazone_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const SESSION_VERSION = 'v1';

function credentialsReady(): boolean {
  return process.env.ADMIN_AUTH_ENABLED === 'true' &&
    Boolean(process.env.ADMIN_PASSWORD_SCRYPT) &&
    Boolean(process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32);
}

export function adminAuthConfigured() { return credentialsReady(); }

export function verifyAdminPassword(candidate: string): boolean {
  if(!credentialsReady() || candidate.length > 1024) return false;
  const value = process.env.ADMIN_PASSWORD_SCRYPT || '';
  const sections = value.split(':');
  if(sections.length!==2 || !/^[a-f0-9]{32}$/.test(sections[0]) ||
      !/^[a-f0-9]{128}$/.test(sections[1])) return false;
  const computed=scryptSync(candidate,Buffer.from(sections[0],'hex'),64);
  const expected=Buffer.from(sections[1],'hex');
  return timingSafeEqual(computed,expected);
}

function signature(payload:string):string {
  return createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(payload).digest('hex');
}

export function createAdminSession():string {
  if(!credentialsReady())throw Error('Administrator authentication is not configured.');
  const issued=Math.floor(Date.now()/1000);
  const payload=[SESSION_VERSION,String(issued),String(issued+SESSION_SECONDS),randomBytes(16).toString('hex')].join('.');
  return payload+'.'+signature(payload);
}

export function checkAdminSession(token:string|undefined):boolean {
  if(!credentialsReady() || !token || token.length>256)return false;
  const fragments=token.split('.');
  if(fragments.length!==5 || fragments[0]!==SESSION_VERSION)return false;
  const [version,start,end,nonce,sig]=fragments;
  if(!/^\d{10}$/.test(start)||!/^\d{10}$/.test(end)||!/^[0-9a-f]{32}$/.test(nonce)||!/^[0-9a-f]{64}$/.test(sig))return false;
  const now=Math.floor(Date.now()/1000);
  const issued=Number(start),expires=Number(end);
  if(issued>now+60||expires<=now||expires-issued!==SESSION_SECONDS)return false;
  const expected=Buffer.from(signature([version,start,end,nonce].join('.')),'hex');
  return timingSafeEqual(expected,Buffer.from(sig,'hex'));
}

export async function isAdminAuthenticated():Promise<boolean> {
  const store=await cookies();
  return checkAdminSession(store.get(ADMIN_COOKIE)?.value);
}
