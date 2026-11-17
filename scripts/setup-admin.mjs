#!/usr/bin/env node
// Local-only credential bootstrap. Keeps existing OpenAI and database variables.
import { randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';

const file=resolve(process.cwd(),'.env.local');
if(!process.stdin.isTTY || !process.stdout.isTTY){
  console.error('Run this setup in an interactive local terminal (not CI).');
  process.exit(1);
}
let existing='';
try{existing=await readFile(file,'utf8');}catch(error){
  if(error?.code!=='ENOENT')throw error;
}
if(/^ADMIN_(?:PASSWORD_SCRYPT|SESSION_SECRET|AUTH_ENABLED)=/m.test(existing)){
  console.error('Administrator credentials already exist in .env.local. Refusing to overwrite them.');
  process.exit(1);
}
emitKeypressEvents(process.stdin);
async function hiddenInput(label){
  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  try{
    return await new Promise((resolve,reject)=>{
      let result='';
      function onKey(character,key){
        if(key?.ctrl && key.name==='c'){
          process.stdin.off('keypress',onKey);
          reject(new Error('Setup cancelled'));
          return;
        }
        if(key?.name==='return' || key?.name==='enter'){
          process.stdin.off('keypress',onKey);
          process.stdout.write('\n');
          resolve(result);
        }else if(key?.name==='backspace'){
          result=result.slice(0,-1);
        }else if(character && character.length===1 && !key?.ctrl && !key?.meta){
          result+=character;
        }
      }
      process.stdin.on('keypress',onKey);
    });
  }finally{
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
}
try{
  const first=await hiddenInput('Choose an administrator password (16+ characters, hidden): ');
  if(first.length<16 || first.length>1024)throw Error('Password must contain 16–1024 characters.');
  const second=await hiddenInput('Confirm password (hidden): ');
  if(first!==second)throw Error('Passwords do not match.');
  const salt=randomBytes(16).toString('hex');
  const hash=scryptSync(first,Buffer.from(salt,'hex'),64).toString('hex');
  const values=[
    'ADMIN_AUTH_ENABLED=true',
    'ADMIN_PASSWORD_SCRYPT='+salt+':'+hash,
    'ADMIN_SESSION_SECRET='+randomBytes(48).toString('hex')
  ];
  if(!/^ALERT_CRON_SECRET=/m.test(existing)){
    values.push('ALERT_CRON_SECRET='+randomBytes(48).toString('hex'));
  }
  const updated=existing.trimEnd()+'\n\n# Private Aquamazone administrator credentials. NEVER commit this file.\n'+values.join('\n')+'\n';
  await writeFile(file,updated,{mode:0o600,flag:'w'});
  await chmod(file,0o600);
  process.stdout.write('Administrator login configured in .env.local. Restart the dev server.\n');
  process.stdout.write('Do not share .env.local or its values.\n');
}catch(error){
  console.error(error instanceof Error?error.message:'Setup unsuccessful');
  process.exitCode=1;
}
