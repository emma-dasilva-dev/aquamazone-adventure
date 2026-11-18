'use client';

import { useEffect, useMemo, useState } from 'react';
import { bookingWindow, checkBookingWindow } from '../lib/reservation-rules';
import { validateBookingContact } from '../lib/booking-contact';
import ContactVerificationFields from './ContactVerificationFields';
import { ArrowUpRight, CalendarDays, Clock3, Minus, Plus, UsersRound } from 'lucide-react';

type Lang='fr'|'en';
type Option={id:string;fr:string;en:string;kind:'activity'|'package';duration?:string;note?:string};
const options:Option[]=[
 {id:'pedalo',fr:'Pédalo simple / double (1 ou 2 pers.)',en:'Single / double pedalo (1 or 2 people)',kind:'activity',duration:'30 min'},
 {id:'canoe',fr:'Canoë-kayak simple / double (1 ou 2 pers.)',en:'Single / double canoe-kayak (1 or 2 people)',kind:'activity',duration:'30 min'},
 {id:'paddle',fr:'Paddle / Stand Up',en:'Stand-up paddle',kind:'activity',duration:'30 min'},
 {id:'waterball',fr:'Bulle gonflable / Water Ball',en:'Inflatable Water Ball',kind:'activity',duration:'20 min'},
 {id:'pedalboat',fr:'Bateau à pédales (2 à 4 pers.)',en:'Pedal-powered boat (2–4 people)',kind:'activity',duration:'30 min'},
 {id:'lake',fr:'Balade sur le lac',en:'Lake outing',kind:'activity',duration:'30–45 min'},
 {id:'mangrove',fr:'Découverte des mangroves',en:'Mangrove discovery',kind:'activity'},
 {id:'glele',fr:'GLÈLÈ — Solo',en:'GLÈLÈ — Solo',kind:'package'},
 {id:'guezo',fr:'GUÉZO — Couple',en:'GUÉZO — Couple',kind:'package'},
 {id:'toffa',fr:'TOFFA — Famille',en:'TOFFA — Family',kind:'package'},
 {id:'behanzin',fr:'BÉHANZIN — Groupe',en:'BÉHANZIN — Group',kind:'package'}
];
const slots=['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
const WA='https://wa.me/2290154284444';
const format=(n:number)=>new Intl.NumberFormat('fr-FR').format(n)+' FCFA';
function nextDay(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Porto-Novo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(type:string)=>parts.find(p=>p.type===type)?.value||'';const today=new Date(get('year')+'-'+get('month')+'-'+get('day')+'T00:00:00Z');today.setUTCDate(today.getUTCDate()+1);return today.toISOString().slice(0,10);}
function isWeekend(date:string){if(!date)return false;const parts=date.split('-').map(Number);if(parts.length!==3)return false;const d=new Date(parts[0],parts[1]-1,parts[2]);return d.getFullYear()===parts[0]&&d.getMonth()===parts[1]-1&&d.getDate()===parts[2]&&[0,6].includes(d.getDay());}
function estimate(id:string,adults:number,children:number){
 const count=adults+children;
 if(!count)return null;
 if(id==='glele')return {total:adults*5000+children*3500,crossingIncluded:true};
 if(id==='guezo')return adults===2&&children===0?{total:12000,crossingIncluded:true}:null;
 if(id==='behanzin')return adults===4&&children===0?{total:36000,crossingIncluded:true}:null;
 if(id==='toffa')return adults===2&&children===2?{total:18000,crossingIncluded:true}:null;
 if(id==='lake'||id==='mangrove')return null;
 if(id==='pedalboat')return count>=2&&count<=4?{total:count*(count===2?5000:3000)+adults*1500+children*500,crossingIncluded:false}:null;
 return {total:count*3000+adults*1500+children*500,crossingIncluded:false};
}
export default function ReservationPlanner({lang}:{lang:Lang}){
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{const refresh=()=>setNow(new Date());refresh();const timer=setInterval(refresh,60000);return ()=>clearInterval(timer);},[]);
 const [id,setId]=useState('pedalo');
 const [date,setDate]=useState('');
 const [time,setTime]=useState('12:00');
 const [adults,setAdults]=useState(2);
 const [children,setChildren]=useState(0);
 const [choice,setChoice]=useState<'canoe'|'pedalo'>('canoe');
 const [checking,setChecking]=useState(false);
 const [serverError,setServerError]=useState('');
 const [fullName,setFullName]=useState('');
 const [phone,setPhone]=useState('');
 const contactValidation=validateBookingContact({fullName,phone});

 const schedule=now?bookingWindow(now):null;
 const windowCheck=now?checkBookingWindow(date,now):null;
 const saturdayOpen=now?checkBookingWindow(schedule!.saturday,now).ok:false;
 const sundayOpen=now?checkBookingWindow(schedule!.sunday,now).ok:false;
 const selected=options.find(o=>o.id===id)!;
 const count=adults+children;
 const dateValid=Boolean(windowCheck?.ok);
 const groupValid=count>0 && (id==='guezo'?adults===2&&children===0:id==='behanzin'?adults===4&&children===0:id==='toffa'?adults===2&&children===2:id==='glele'?count===1:id==='pedalboat'?count>=2&&count<=4:true);
 const quote=useMemo(()=>estimate(id,adults,children),[id,adults,children]);
 const okay=dateValid&&groupValid&&Boolean(time);
 const ready=okay&&contactValidation.ok;
 const activityLabel=selected[lang];
 const text=lang==='fr'?{
  eyebrow:'09 / PRÉPARER UNE VISITE',heading:<>Votre prochaine aventure <em>commence ici.</em></>,desc:'Composez votre visite en quelques étapes. Notre équipe confirmera ensuite les disponibilités et les modalités.',kind:'CHOISIR UNE EXPÉRIENCE',activity:'Activité',pack:'Forfait',date:'DATE SOUHAITÉE',time:'HEURE SOUHAITÉE',people:'PARTICIPANTS',adult:'Adultes',child:'Enfants de moins de 12 ans',choose:'ACTIVITÉ AU CHOIX',canoe:'Canoë-kayak simple',pedalo:'Pédalo simple',summary:'RÉCAPITULATIF',price:'Estimation',unknown:'Tarif à confirmer',cross:'Traversée aller-retour incluse',crossSeparate:'Traversée aller-retour ajoutée au tarif',contact:'Envoyer ma demande sur WhatsApp',identity:'VOS COORDONNÉES',fullName:'Nom et prénom',phone:'Numéro WhatsApp international',phoneHelp:'Avec indicatif du pays, par exemple +229 01 54 28 44 44 ou +33 6 12 34 56 78.',identityHelp:'Un seul contact pour le groupe. Le nom et le numéro WhatsApp sont obligatoires.',notVerified:'Vos coordonnées seront transmises avec la demande. La vérification du numéro WhatsApp sera activée avant le paiement en ligne.',contactInvalid:'Vérifiez votre nom et votre numéro WhatsApp international.',notice:'Ceci est une demande, pas une réservation confirmée. Aucun paiement n’est effectué sur ce site.',serverError:'Impossible de vérifier votre demande pour le moment. Réessayez ou contactez notre équipe directement.',validation:'Sélectionnez une date ouverte du week-end à venir et respectez les conditions du forfait.',weekday:'En semaine, les visites nécessitent une organisation préalable avec notre équipe. Contactez-nous sur WhatsApp avant tout déplacement.',costNote:'Les tarifs sont indicatifs selon le choix et la composition du groupe. Les disponibilités restent à confirmer.',help:'Informations et réservation : +229 01 54 28 44 44'
 }:{
  eyebrow:'09 / PLAN A VISIT',heading:<>Your next adventure <em>starts here.</em></>,desc:'Plan your visit in a few steps. Our team will confirm availability and arrangements.',kind:'CHOOSE AN EXPERIENCE',activity:'Activity',pack:'Package',date:'PREFERRED DATE',time:'PREFERRED TIME',people:'GUESTS',adult:'Adults',child:'Children under 12',choose:'CHOOSE ONE ACTIVITY',canoe:'Single canoe-kayak',pedalo:'Single pedal boat',summary:'YOUR SUMMARY',price:'Estimate',unknown:'Price to be confirmed',cross:'Return crossing included',crossSeparate:'Return crossing added to price',contact:'Send enquiry on WhatsApp',identity:'YOUR CONTACT DETAILS',fullName:'Full name',phone:'International WhatsApp number',phoneHelp:'Include the country calling code, e.g. +229 01 54 28 44 44 or +33 6 12 34 56 78.',identityHelp:'Only one contact person per group. Both fields are required.',notVerified:'Your contact details will be sent with the enquiry. WhatsApp number verification will be enabled before online payment.',contactInvalid:'Check your full name and international WhatsApp number.',notice:'This is an enquiry, not a confirmed booking. No payment is collected on this website.',serverError:'We could not validate your request right now. Please try again or contact our team directly.',validation:'Choose an eligible date for the upcoming weekend and meet the package guest requirements.',weekday:'Weekday visits must be arranged with our team in advance. Contact us on WhatsApp before travelling.',costNote:'Prices are estimates based on your choices. Availability remains subject to confirmation.',help:'Information and enquiries: +229 01 54 28 44 44'
 };
 const bookingNotice=lang==='fr'?
  (!schedule?'Chargement du calendrier…':!saturdayOpen&&!sundayOpen?'Réservations clôturées. Réouverture lundi.':
   'Ouverture lundi pour le week-end à venir. Samedi : jusqu’au vendredi 22h. Dimanche : jusqu’au samedi 22h (heure du Bénin).'):
  (!schedule?'Loading booking dates…':!saturdayOpen&&!sundayOpen?'Bookings are closed. Reopening Monday.':
   'Bookings open Monday for the upcoming weekend. Saturday: until Friday 10pm. Sunday: until Saturday 10pm (Benin time).');
 const dateNotice=date&&!dateValid?(lang==='fr'?
   'Cette date ne peut pas être demandée en ligne. Choisissez un jour encore ouvert ou contactez-nous sur WhatsApp.':
   'This date cannot be requested online. Choose an open date or message us on WhatsApp.'):null;
 const onRequest=async()=>{
  if(!ready || checking)return;
  setChecking(true);
  setServerError('');
  try {
   const response=await fetch('/api/reservation/quote',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({experience:id,date,time,adults,children,fullName,phone,...(id==='glele'?{choice}:{})})
   });
   const result=await response.json() as {
     ok:boolean;code?:string;
     quote?:{total:number|null;bookingConfirmed:false;paymentCollected:false;availabilityChecked:false};
   };
   if(!response.ok||!result.ok||!result.quote)throw new Error(result.code||'invalid_response');
   const validated=result.quote;
   const lines=lang==='fr'?[
     'Bonjour AQUAMAZONE, je souhaite demander une réservation.',
     'Nom et prénom : '+(contactValidation.ok?contactValidation.contact.fullName:fullName),
     'Téléphone WhatsApp : '+(contactValidation.ok?contactValidation.contact.phone:phone),
     'Expérience : '+activityLabel,
     'Date : '+date,'Heure souhaitée : '+time,
     'Adultes : '+adults,'Enfants (<12 ans) : '+children,
     ...(id==='glele'?['Activité choisie : '+(choice==='canoe'?'Canoë-kayak simple':'Pédalo simple')]:[]),
     'Estimation indicative : '+(validated.total===null?'À confirmer':format(validated.total)),
     'Coordonnées communiquées, non vérifiées. Ceci est une demande non confirmée. Merci de vérifier la disponibilité et le prix final.'
   ]:[
     'Hello AQUAMAZONE, I would like to enquire about a booking.',
     'Full name: '+(contactValidation.ok?contactValidation.contact.fullName:fullName),
     'WhatsApp number: '+(contactValidation.ok?contactValidation.contact.phone:phone),
     'Experience: '+activityLabel,'Date: '+date,'Preferred time: '+time,
     'Adults: '+adults,'Children (under 12): '+children,
     ...(id==='glele'?['Chosen activity: '+(choice==='canoe'?'Single canoe-kayak':'Single pedal boat')]:[]),
     'Indicative estimate: '+(validated.total===null?'To be confirmed':format(validated.total)),
     'Contact details supplied, not verified. This is an unconfirmed enquiry. Please verify availability and final pricing.'
   ];
   // Navigate in the current tab to avoid mobile popup blocking after fetch.
   window.location.assign(WA+'?text='+encodeURIComponent(lines.join('\n')));
  } catch {
   setServerError(text.serverError);
  } finally {setChecking(false);}
 };
 const updateCount=(type:'adult'|'child',change:number)=>{
  if(type==='adult')setAdults(n=>Math.min(20,Math.max(0,n+change)));
  else setChildren(n=>Math.min(20,Math.max(0,n+change)));
 };
 return <section id="reservation" className="reservation-v15" aria-labelledby="reservation-title">
  <div className="reservation-v15-shell">
   <div className="reservation-v15-heading"><p>{text.eyebrow}</p><h2 id="reservation-title">{text.heading}</h2><span>{text.desc}</span></div>
   <div className="reservation-v15-layout">
    <div className="reservation-v15-fields">
     <fieldset><legend>{text.kind}</legend><div className="reservation-v15-categories">{(['activity','package'] as const).map(kind=><button key={kind} type="button" className={selected.kind===kind?'active':''} aria-pressed={selected.kind===kind} onClick={()=>{setId(kind==='activity'?'pedalo':'glele');setAdults(kind==='activity'?2:1);setChildren(0);}}>{kind==='activity'?text.activity:text.pack}</button>)}</div><div className="reservation-v15-options">{options.filter(o=>o.kind===selected.kind).map(o=><button type="button" key={o.id} className={id===o.id?'selected':''} aria-pressed={id===o.id} onClick={()=>{setId(o.id);if(o.id==='glele'){setAdults(1);setChildren(0);}if(o.id==='guezo'){setAdults(2);setChildren(0);}if(o.id==='behanzin'){setAdults(4);setChildren(0);}if(o.id==='toffa'){setAdults(2);setChildren(2);}}}><span>{o[lang]}</span>{o.duration&&<small>{o.duration}</small>}</button>)}</div></fieldset>
     <div className="az-reservation-window" role="status">
       <strong>{lang==='fr'?'Calendrier des réservations':'Booking calendar'}</strong>
       <p>{bookingNotice}</p>
       {schedule&&<div className="az-reservation-window-days">
         <button type="button" disabled={!saturdayOpen} aria-pressed={date===schedule.saturday} onClick={()=>setDate(schedule.saturday)}>
           {lang==='fr'?'Samedi':'Saturday'} · {schedule.saturday} <small>{saturdayOpen?(lang==='fr'?'Demandes ouvertes':'Enquiries open'):(lang==='fr'?'Clôturé':'Closed')}</small>
         </button>
         <button type="button" disabled={!sundayOpen} aria-pressed={date===schedule.sunday} onClick={()=>setDate(schedule.sunday)}>
           {lang==='fr'?'Dimanche':'Sunday'} · {schedule.sunday} <small>{sundayOpen?(lang==='fr'?'Demandes ouvertes':'Enquiries open'):(lang==='fr'?'Clôturé':'Closed')}</small>
         </button>
       </div>}
     </div>
     <div className="reservation-v15-two">
      <label>{text.date}<span><CalendarDays size={17} aria-hidden="true"/><input type="date" min={schedule?.saturday??nextDay()} max={schedule?.sunday} value={date} onChange={e=>setDate(e.target.value)} required/></span></label>
      <label>{text.time}<span><Clock3 size={17} aria-hidden="true"/><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(slot=><option key={slot} value={slot}>{slot}</option>)}</select></span></label>
     </div>
     <fieldset className="reservation-v15-people"><legend>{text.people}</legend>{([['adult',text.adult,adults],['child',text.child,children]] as const).map(([type,label,n])=><div key={type} className="reservation-v15-counter"><span>{label}</span><div><button aria-label={(lang==='fr'?'Diminuer ':'Decrease ')+label} disabled={n===0} onClick={()=>updateCount(type,-1)} type="button"><Minus size={17}/></button><output aria-live="polite">{n}</output><button aria-label={(lang==='fr'?'Augmenter ':'Increase ')+label} disabled={n===20} onClick={()=>updateCount(type,1)} type="button"><Plus size={17}/></button></div></div>)}</fieldset>
     {id==='glele'&&<fieldset className="reservation-v15-choice"><legend>{text.choose}</legend><label><input type="radio" name="gleleChoice" checked={choice==='canoe'} onChange={()=>setChoice('canoe')}/>{text.canoe}</label><label><input type="radio" name="gleleChoice" checked={choice==='pedalo'} onChange={()=>setChoice('pedalo')}/>{text.pedalo}</label></fieldset>}
     <fieldset className="az-reservation-identity">
      <legend>{text.identity}</legend>
      <p>{text.identityHelp}</p>
      <div className="az-reservation-identity-fields">
       <label htmlFor="az-contact-name">{text.fullName} <span aria-hidden="true">*</span>
        <input id="az-contact-name" name="contactName" type="text" autoComplete="name" maxLength={100} required
          placeholder={lang==='fr'?'Votre nom complet':'Your full name'} value={fullName} onChange={e=>setFullName(e.target.value)}/>
       </label>
       <label htmlFor="az-contact-phone">{text.phone} <span aria-hidden="true">*</span>
        <input id="az-contact-phone" name="contactPhone" type="tel" autoComplete="tel" inputMode="tel" maxLength={32} required
          placeholder="+229 01 54 28 44 44" value={phone} onChange={e=>setPhone(e.target.value)}/>
        <small>{text.phoneHelp}</small>
       </label>
      </div>
      <ContactVerificationFields lang={lang} phone={phone}/>
      <p className="az-reservation-contact-disclaimer">{text.notVerified}</p>
     </fieldset>
    </div>
    <aside className="reservation-v15-summary" aria-label={text.summary}>
     <div className="reservation-v15-summary-top"><span>{text.summary}</span><UsersRound size={22}/></div>
     <h3>{activityLabel}</h3><div className="reservation-v15-summary-detail"><div><span>{text.date}</span><strong>{date||'—'}</strong></div><div><span>{text.time}</span><strong>{time}</strong></div><div><span>{text.people}</span><strong>{adults} + {children}</strong></div></div>
     {id==='toffa'&&<p className="reservation-v15-hint">{lang==='fr'
       ?'TOFFA comprend la traversée en pirogue aller-retour, un bateau à pédales familial (4 personnes) et du jus offert.'
       :'TOFFA includes the return pirogue crossing, a family pedal-powered boat (4 people), and complimentary juice.'}</p>}
     <div className="reservation-v15-total"><span>{text.price}</span><strong>{quote?format(quote.total):text.unknown}</strong><small>{selected.kind==='package'?text.cross:text.crossSeparate}</small></div>
     <p className="reservation-v15-hint">{text.costNote}</p>
     {!okay&&<p className="reservation-v15-error" role="status">{dateNotice||text.validation}</p>}
     {okay&&!contactValidation.ok&&<p className="reservation-v15-error" role="status">{text.contactInvalid}</p>}
     {serverError&&<p className="reservation-v15-error" role="alert">{serverError} <a href={WA} target="_blank" rel="noopener noreferrer">WhatsApp</a></p>}
     <button className="reservation-v15-cta" type="button" onClick={onRequest} disabled={!ready||checking}>{checking?(lang==='fr'?'Vérification…':'Checking…'):text.contact}<ArrowUpRight size={19}/></button>
     <p className="reservation-v15-disclaimer">{text.notice}</p>
    </aside>
   </div>
   <div className="reservation-v15-bottom"><p>{text.weekday}</p><a href={WA} target="_blank" rel="noopener noreferrer">{text.help}<ArrowUpRight size={17}/></a></div>
  </div>
 </section>;
}
