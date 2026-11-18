#!/usr/bin/env node
/**
 * Generate only the independent OTP HMAC secret. Never print credentials.
 * Does not modify any existing administrator or Neon secrets.
 */
import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const path=resolve(process.cwd(),'.env.local');
if(!existsSync(path)){
  console.error('Create .env.local first (private configuration only).');
  process.exitCode=1;
}else{
  const original=readFileSync(path,'utf8');
  const lines=original.split(/\r?\n/);
  const existing=lines.find(line=>/^CONTACT_OTP_SECRET\s*=/.test(line));
  if(existing&&existing.split('=').slice(1).join('=').trim()){
    console.log('CONTACT_OTP_SECRET already configured; nothing changed.');
  }else{
    const value=randomBytes(32).toString('hex');
    const updated=existing?
      lines.map(line=>/^CONTACT_OTP_SECRET\s*=/.test(line)?'CONTACT_OTP_SECRET='+value:line).join('\n'):
      original.replace(/\s*$/,'')+'\nCONTACT_OTP_SECRET='+value+'\n';
    writeFileSync(path,updated,{encoding:'utf8',mode:0o600});
    console.log('Generated a private CONTACT_OTP_SECRET in .env.local.');
  }
  console.log('Next: configure DATABASE_URL_CONTACT_VERIFICATION, CONTACT_EMAIL_FROM, Resend and Meta OTP template credentials.');
}
