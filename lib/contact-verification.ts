import 'server-only';
import {createHmac,randomBytes,randomInt} from 'node:crypto';
import {neon} from '@neondatabase/serverless';

export type ContactChannel='email'|'whatsapp';
export const CONTACT_COOKIE='aquamazone_contact_session';

function secret():string|null{
  const value=process.env.CONTACT_OTP_SECRET;
  return value&&value.length>=32?value:null;
}
export function verificationConfigured():boolean{
  return Boolean(secret()&&process.env.DATABASE_URL_CONTACT_VERIFICATION);
}
export function channelConfigured(channel:ContactChannel):boolean{
  if(!verificationConfigured())return false;
  if(channel==='email')return Boolean(process.env.RESEND_API_KEY&&process.env.CONTACT_EMAIL_FROM);
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&
    process.env.WHATSAPP_OTP_TEMPLATE_NAME);
}
export function normalizeDestination(channel:ContactChannel,raw:unknown):string|null{
  if(typeof raw!=='string')return null;
  const value=raw.trim();
  if(channel==='whatsapp'){
    const phone=value.replace(/[\s().-]/g,'');
    return value.length<=32&&/^\+[1-9]\d{6,14}$/.test(phone)?phone:null;
  }
  const email=value.toLowerCase();
  return email.length>=5&&email.length<=254&&!/\s/.test(email)&&
    /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>.]{2,}$/.test(email)?email:null;
}
export function newContactSession():string{return randomBytes(32).toString('base64url');}
export function validContactSession(session:unknown):session is string{
  return typeof session==='string'&&/^[A-Za-z0-9_-]{43}$/.test(session);
}
export function hashed(...parts:string[]):string{
  const value=secret();
  if(!value)throw Error('Contact verification is disabled');
  return createHmac('sha256',value).update(parts.join('\x00')).digest('hex');
}
export function generateCode():string{return String(randomInt(0,1000000)).padStart(6,'0');}
export function verificationDb(){
  const url=process.env.DATABASE_URL_CONTACT_VERIFICATION;
  if(!verificationConfigured()||!url)throw Error('Contact verification is disabled');
  const parsed=new URL(url);
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||parsed.pathname!=='/aquamazone'
      ||parsed.username!=='aquamazone_contact_verify')
    throw Error('Contact verification database role mismatch');
  return neon(url);
}

export async function sendContactCode(channel:ContactChannel,destination:string,code:string):Promise<boolean>{
  if(!channelConfigured(channel))return false;
  try{
    if(channel==='email'){
      const response=await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,
          'Content-Type':'application/json','User-Agent':'Aquamazone-Adventure/1.0'},
        body:JSON.stringify({
          from:process.env.CONTACT_EMAIL_FROM,
          to:[destination],
          subject:'AQUAMAZONE — Code de vérification',
          text:'Votre code de vérification AQUAMAZONE est '+code+
            '. Il expire dans 5 minutes. Ne le partagez avec personne.'
        }),
        signal:AbortSignal.timeout(10000)
      });
      return response.ok;
    }
    const version=process.env.WHATSAPP_GRAPH_VERSION||'v26.0';
    if(!/^v\d{1,2}\.\d$/.test(version))return false;
    const response=await fetch('https://graph.facebook.com/'+version+'/'+
       encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID!)+'/messages',{
      method:'POST',
      headers:{Authorization:'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN,
        'Content-Type':'application/json'},
      body:JSON.stringify({
        messaging_product:'whatsapp',
        recipient_type:'individual',
        to:destination.slice(1),
        type:'template',
        template:{
          name:process.env.WHATSAPP_OTP_TEMPLATE_NAME,
          language:{code:process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE||'fr'},
          components:[
            {type:'body',parameters:[{type:'text',text:code}]},
            {type:'button',sub_type:'url',index:'0',parameters:[{type:'text',text:code}]}
          ]
        }
      }),
      signal:AbortSignal.timeout(10000)
    });
    return response.ok;
  }catch{return false;}
}
