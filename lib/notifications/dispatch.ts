import 'server-only';
import { neon } from '@neondatabase/serverless';

type Channel = 'email'|'whatsapp';
type AlertJob = {
  id:string;lease_token:string;event_type:string;channel:Channel;
  payload:{reference:string;experience:string;visitDate:string;requestedTime:string;
    reservationStatus:string;paymentStatus:string;amountXof:number|null};
};

function database(){
  const url=process.env.DATABASE_URL_ALERTS;
  if(!url)throw new Error('Notification database connection is not configured.');
  const parsed=new URL(url);
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||parsed.pathname!=='/aquamazone')
    throw new Error('Expected dedicated aquamazone database.');
  return neon(url);
}
function configuredChannels():Channel[]{
  const channels:Channel[]=[];
  if(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_FROM && process.env.ALERT_EMAIL_TO)
    channels.push('email');
  if(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ADMIN_TO && process.env.WHATSAPP_ALERT_TEMPLATE_NAME)
    channels.push('whatsapp');
  return channels;
}
function textFor(job:AlertJob):string{
  const p=job.payload;
  const amount=p.amountXof==null?'À confirmer':new Intl.NumberFormat('fr-FR').format(p.amountXof)+' FCFA';
  return [
    'AQUAMAZONE — '+job.event_type.replaceAll('_',' '),
    'Référence : '+p.reference,
    'Expérience : '+p.experience,
    'Date : '+p.visitDate+' à '+p.requestedTime,
    'Montant indicatif : '+amount,
    'Réservation : '+p.reservationStatus,
    'Paiement : '+p.paymentStatus,
    'Consulter le tableau de bord privé pour les détails.',
    'ATTENTION : aucun paiement n’est confirmé par cette notification.'
  ].join('\n');
}
async function sendEmail(job:AlertJob):Promise<string>{
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      'Authorization':'Bearer '+process.env.RESEND_API_KEY,
      'Content-Type':'application/json',
      'Idempotency-Key':job.id
    },
    body:JSON.stringify({
      from:process.env.ALERT_EMAIL_FROM,
      to:[process.env.ALERT_EMAIL_TO],
      subject:'Aquamazone · '+job.event_type.replaceAll('_',' ')+' · '+job.payload.reference,
      text:textFor(job)
    }),
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)throw Error('Email provider returned '+response.status);
  const parsed=await response.json() as {id?:string};
  if(!parsed.id)throw Error('Email provider returned no acceptance identifier.');
  return parsed.id;
}
async function sendWhatsApp(job:AlertJob):Promise<string>{
  // Requires a Meta-approved utility template with TWO body placeholders:
  // {{1}} = reservation reference, {{2}} = event category / status.
  const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID!;
  if(!/^\d+$/.test(phoneId))throw Error('Invalid WhatsApp phone number ID.');
  const recipient=process.env.WHATSAPP_ADMIN_TO!;
  if(!/^\d{8,15}$/.test(recipient))throw Error('Invalid WhatsApp recipient number.');
  const url='https://graph.facebook.com/v27.0/'+phoneId+'/messages';
  const response=await fetch(url,{
    method:'POST',
    headers:{
      Authorization:'Bearer '+process.env.WHATSAPP_ACCESS_TOKEN,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      messaging_product:'whatsapp',
      to:recipient,
      type:'template',
      template:{
        name:process.env.WHATSAPP_ALERT_TEMPLATE_NAME,
        language:{code:process.env.WHATSAPP_ALERT_TEMPLATE_LANGUAGE||'fr'},
        components:[{type:'body',parameters:[
          {type:'text',text:job.payload.reference},
          {type:'text',text:job.event_type.replaceAll('_',' ')+' / '+job.payload.reservationStatus}
        ]}]
      }
    }),
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)throw Error('WhatsApp provider returned '+response.status);
  const parsed=await response.json() as {messages?:{id?:string}[]};
  const id=parsed.messages?.[0]?.id;
  if(!id)throw Error('WhatsApp provider returned no acceptance identifier.');
  return id;
}

/**
 * Consume at most 10 queued jobs per call.
 * The DB lease avoids concurrent workers using the same job. Resend uses an
 * idempotency key; WhatsApp may duplicate if Meta accepted but HTTP timed out.
 * Accepted means provider API accepted, NOT delivered to the recipient.
 */
export async function dispatchAlerts(){
  const channels=configuredChannels();
  if(!channels.length)return {configured:false,claimed:0,accepted:0,failed:0};
  const sql=database();
  const rows=await sql`SELECT id::text,lease_token::text,event_type,channel,payload
    FROM claim_reservation_alerts(10, ${channels}::text[])`;
  const jobs=rows as unknown as AlertJob[];
  let accepted=0,failed=0;
  for(const job of jobs){
    let success=false,providerId='',error='';
    try{
      providerId=job.channel==='email'?await sendEmail(job):await sendWhatsApp(job);
      success=true;accepted++;
    }catch{
      error='Provider request failed or timed out';
      failed++;
    }
    await sql`SELECT finish_reservation_alert(
      ${job.id}::uuid,${job.lease_token}::uuid,${success},${providerId},${error}
    )`;
  }
  return {configured:true,claimed:jobs.length,accepted,failed};
}
