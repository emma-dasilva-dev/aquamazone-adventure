'use client';

import {useEffect,useState} from 'react';
import {CheckCircle2,Mail,MessageCircle,ShieldCheck} from 'lucide-react';

type Lang='fr'|'en';
type Channel='email'|'whatsapp';
type Status={sent:boolean;verified:boolean;busy:boolean;code:string;error:string};
const initial=():Status=>({sent:false,verified:false,busy:false,code:'',error:''});
type Props={lang:Lang;phone:string;email:string};

export default function ContactVerificationFields({lang,phone,email}:Props){
  const [available,setAvailable]=useState<{email:boolean;whatsapp:boolean}>({email:false,whatsapp:false});
  const [ready,setReady]=useState(false);
  const [whatsapp,setWhatsapp]=useState<Status>(initial);
  const [mail,setMail]=useState<Status>(initial);
  const french=lang==='fr';

  useEffect(()=>{
    let active=true;
    fetch('/api/reservation/contact',{cache:'no-store'})
      .then(response=>response.json())
      .then(result=>{if(active&&result.ok)setAvailable(result.available);})
      .catch(()=>{})
      .finally(()=>{if(active)setReady(true);});
    return ()=>{active=false;};
  },[]);

  // Never reuse a verified indicator after the customer edits a destination.
  useEffect(()=>{setWhatsapp(initial());},[phone]);
  useEffect(()=>{setMail(initial());},[email]);

  const describeError=(code:string)=>{
    if(code==='wait_or_rate_limited')
      return french?'Patientez avant de demander un nouveau code.':'Please wait before requesting another code.';
    if(code==='code_incorrect_or_expired'||code==='invalid_code')
      return french?'Code incorrect, expiré ou déjà utilisé.':'Incorrect, expired or already used code.';
    if(code==='invalid_destination')
      return french?'Vérifiez les coordonnées avant de continuer.':'Check the contact details before continuing.';
    return french?'Vérification indisponible. Réessayez ou contactez-nous.':
      'Verification is unavailable. Try again or contact our team.';
  };

  const send=async(channel:Channel)=>{
    const destination=channel==='email'?email:phone;
    const change=channel==='email'?setMail:setWhatsapp;
    change(old=>({...old,busy:true,error:''}));
    try{
      const response=await fetch('/api/reservation/contact',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'send',channel,destination})
      });
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.code||'error');
      change(old=>({...old,busy:false,sent:true,code:'',verified:false}));
    }catch(error){
      change(old=>({...old,busy:false,error:describeError(error instanceof Error?error.message:'error')}));
    }
  };
  const verify=async(channel:Channel)=>{
    const destination=channel==='email'?email:phone;
    const status=channel==='email'?mail:whatsapp;
    const change=channel==='email'?setMail:setWhatsapp;
    if(!/^\d{6}$/.test(status.code))return;
    change(old=>({...old,busy:true,error:''}));
    try{
      const response=await fetch('/api/reservation/contact',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'verify',channel,destination,code:status.code})
      });
      const result=await response.json();
      if(!response.ok||result.verified!==true)throw new Error(result.code||'error');
      change(old=>({...old,busy:false,verified:true,sent:false,code:''}));
    }catch(error){
      change(old=>({...old,busy:false,error:describeError(error instanceof Error?error.message:'error')}));
    }
  };
  if(!ready)return null;
  return <div className="az-contact-verify" aria-label={french?'Vérification des coordonnées':'Contact verification'}>
    <div className="az-contact-verify-heading"><ShieldCheck size={18} aria-hidden="true"/>
      <span>{french?'Vérification des coordonnées':'Contact verification'}</span>
    </div>
    <p>{french?
      'Pour les futures réservations payées en ligne, nous vérifierons séparément WhatsApp et votre adresse e-mail. La demande par WhatsApp reste possible sans code.':
      'For future paid online bookings, we will verify WhatsApp and your email separately. You can still send a WhatsApp enquiry without a code.'}</p>
    {([['whatsapp',whatsapp,phone,MessageCircle],['email',mail,email,Mail]] as const).map(([channel,state,destination,Icon])=>
      <div className="az-contact-verify-row" key={channel}>
        <div className="az-contact-verify-row-head">
          <span><Icon size={16} aria-hidden="true"/>{channel==='whatsapp'?'WhatsApp':'E-mail'}</span>
          {state.verified?<span className="az-contact-verified"><CheckCircle2 size={15}/>{french?'Vérifié':'Verified'}</span>:
            available[channel]?
             <button type="button" onClick={()=>send(channel)} disabled={state.busy||destination.trim().length<5}>
              {state.busy?(french?'En cours…':'Working…'):state.sent?(french?'Renvoyer le code':'Resend code'):(french?'Envoyer un code':'Send a code')}
             </button>:
             <small>{french?'Bientôt disponible':'Coming soon'}</small>}
        </div>
        {state.sent&&!state.verified&&<div className="az-contact-verify-code">
          <label htmlFor={'az-code-'+channel}>{french?'Code à 6 chiffres (valable 5 min)':'6-digit code (valid 5 min)'}</label>
          <div><input id={'az-code-'+channel} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
             autoComplete="one-time-code" value={state.code} onChange={event=>setCode(event.target.value,channel)}/>
            <button type="button" disabled={state.busy||state.code.length!==6} onClick={()=>verify(channel)}>
             {french?'Vérifier':'Verify'}
            </button></div>
        </div>}
        {state.error&&<p className="az-contact-verify-error" role="alert">{state.error}</p>}
      </div>)}
  </div>;

  function setCode(value:string,channel:Channel){
    const change=channel==='email'?setMail:setWhatsapp;
    change(old=>({...old,code:value.replace(/\D/g,'').slice(0,6),error:''}));
  }
}
