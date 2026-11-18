'use client';

import {useEffect,useState} from 'react';
import {CheckCircle2,MessageCircle,ShieldCheck} from 'lucide-react';
import {normalizeBookingPhone} from '../lib/booking-contact';

type Lang='fr'|'en';
type Status={sent:boolean;verified:boolean;busy:boolean;code:string;error:string};
const initial=():Status=>({sent:false,verified:false,busy:false,code:'',error:''});

export default function ContactVerificationFields({lang,phone}:{lang:Lang;phone:string}){
  const [available,setAvailable]=useState(false);
  const [ready,setReady]=useState(false);
  const [status,setStatus]=useState<Status>(initial);
  const french=lang==='fr';
  const normalized=normalizeBookingPhone(phone);

  useEffect(()=>{
    let active=true;
    fetch('/api/reservation/contact',{cache:'no-store'})
      .then(response=>response.json())
      .then(result=>{if(active)setAvailable(result.ok===true&&result.available?.whatsapp===true);})
      .catch(()=>{})
      .finally(()=>{if(active)setReady(true);});
    return ()=>{active=false;};
  },[]);

  useEffect(()=>{setStatus(initial());},[phone]);

  useEffect(()=>{
    if(!available||!normalized)return;
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      fetch('/api/reservation/contact',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'status',channel:'whatsapp',destination:normalized}),
        signal:controller.signal
      }).then(response=>response.json())
        .then(result=>{if(result.ok&&result.verified===true)
          setStatus(old=>({...old,verified:true,sent:false,error:''}));})
        .catch(()=>{});
    },700);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[available,normalized]);

  const explain=(code:string)=>{
    if(code==='wait_or_rate_limited')
      return french?'Patientez avant de demander un nouveau code.':'Please wait before requesting another code.';
    if(code==='code_incorrect_or_expired'||code==='invalid_code')
      return french?'Code incorrect, expiré ou déjà utilisé.':'Incorrect, expired or already used code.';
    if(code==='invalid_destination')
      return french?'Vérifiez votre numéro international.':'Check your international number.';
    return french?'Vérification indisponible. Réessayez ou contactez-nous.':
      'Verification is unavailable. Try again or contact our team.';
  };

  const submit=async(action:'send'|'verify')=>{
    if(!normalized||status.busy||(action==='verify'&&!/^\d{6}$/.test(status.code)))return;
    setStatus(old=>({...old,busy:true,error:''}));
    try{
      const response=await fetch('/api/reservation/contact',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action,channel:'whatsapp',destination:normalized,
          ...(action==='verify'?{code:status.code}:{})
        })
      });
      const result=await response.json();
      if(!response.ok||!result.ok||(action==='verify'&&result.verified!==true))
        throw new Error(result.code||'error');
      if(action==='verify')setStatus(old=>({...old,busy:false,verified:true,sent:false,code:''}));
      else setStatus(old=>({...old,busy:false,verified:false,sent:true,code:''}));
    }catch(error){
      setStatus(old=>({...old,busy:false,error:explain(error instanceof Error?error.message:'error')}));
    }
  };

  // Do not expose inactive verification UI before a provider is configured.
  if(!ready||!available)return null;
  return <div className="az-contact-verify" aria-label={french?'Vérification WhatsApp':'WhatsApp verification'}>
    <div className="az-contact-verify-heading">
      <ShieldCheck size={18} aria-hidden="true"/>
      <span>{french?'Vérification WhatsApp':'WhatsApp verification'}</span>
    </div>
    <p>{french?
      'Pour le futur paiement en ligne, nous vérifierons votre numéro WhatsApp. Vous pouvez toujours envoyer une demande sans code.':
      'For future online payments, we will verify your WhatsApp number. You can still send an enquiry without a code.'}</p>
    <div className="az-contact-verify-row">
      <div className="az-contact-verify-row-head">
        <span><MessageCircle size={16} aria-hidden="true"/>WhatsApp</span>
        {status.verified?
          <span className="az-contact-verified"><CheckCircle2 size={15}/>{french?'Vérifié':'Verified'}</span>:
          <button type="button" disabled={status.busy||!normalized} onClick={()=>submit('send')}>
            {status.busy?(french?'En cours…':'Working…'):
              status.sent?(french?'Renvoyer le code':'Resend code'):(french?'Envoyer un code':'Send a code')}
          </button>}
      </div>
      {status.sent&&!status.verified&&<div className="az-contact-verify-code">
        <label htmlFor="az-code-whatsapp">{french?'Code à 6 chiffres (valable 5 min)':'6-digit code (valid 5 min)'}</label>
        <div>
          <input id="az-code-whatsapp" type="text" inputMode="numeric" pattern="[0-9]{6}"
            maxLength={6} autoComplete="one-time-code" value={status.code}
            onChange={event=>setStatus(old=>({...old,code:event.target.value.replace(/\D/g,'').slice(0,6),error:''}))}/>
          <button type="button" disabled={status.busy||status.code.length!==6}
            onClick={()=>submit('verify')}>{french?'Vérifier':'Verify'}</button>
        </div>
      </div>}
      {status.error&&<p className="az-contact-verify-error" role="alert">{status.error}</p>}
    </div>
  </div>;
}
