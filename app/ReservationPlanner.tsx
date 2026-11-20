'use client';

import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Minus,Plus,MessageCircle} from 'lucide-react';
import {bookingWindow,checkBookingWindow,RESERVATION_SLOTS} from '../lib/reservation-rules';
import {validateBookingContact} from '../lib/booking-contact';
import {ACTIVITIES,isPackageEligible,validatePlan,activityAmount,type ActivityId,type PackageId,type Line} from '../lib/reservation-plan';

type Lang='fr'|'en';
const WA='https://wa.me/2290154284444?text=';
const money=(n:number)=>new Intl.NumberFormat('fr-FR').format(n)+' FCFA';
const activityData:Record<ActivityId,{fr:string;en:string;duration:string;image:string;hint:string}>={
 pedalo:{fr:'Pédalo',en:'Pedalo',duration:'30 min',image:'/images/activities/pedalo-double.webp',hint:'3 000 FCFA / pers.'},
 canoe:{fr:'Canoë-kayak',en:'Canoe-kayak',duration:'30 min',image:'/images/activities/canoe-double.webp',hint:'3 000 FCFA / pers.'},
 paddle:{fr:'Paddle / Stand Up',en:'Stand-up paddle',duration:'30 min',image:'/images/activities/paddle.webp',hint:'3 000 FCFA / pers.'},
 waterball:{fr:'Bulle gonflable / Water Ball',en:'Inflatable Water Ball',duration:'20 min',image:'/images/activities/structure-gonflable.webp',hint:'3 000 FCFA / pers.'},
 pedalboat:{fr:'Bateau à pédales',en:'Pedal-powered boat',duration:'30 min',image:'/images/activities/bateau-a-pedales.webp',hint:'2 pers. : 10 000 · 3–4 : 3 000/pers.'},
 lake:{fr:'Balade sur le lac / Visite des mangroves',en:'Lake tour / Mangrove visit',duration:'30–45 min',image:'/images/activities/mangrove-paysage.webp',hint:'Adulte 5 000 · Enfant 2 500 FCFA'}
};
const packageData:{id:PackageId;fr:string;en:string;infoFr:string;infoEn:string;image:string}[]=[
 {id:'glele',fr:'GLÈLÈ · Solo',en:'GLÈLÈ · Solo',infoFr:'Traversée + une activité par personne, au choix',infoEn:'Crossing + one activity per guest',image:'/images/activities/canoe-simple.webp'},
 {id:'guezo',fr:'GUÉZO · Couple',en:'GUÉZO · Couple',infoFr:'Traversée, canoë double, pédalo double, eau offerte',infoEn:'Crossing, double kayak, double pedalo, complimentary water',image:'/images/gallery/gallery-01.webp'},
 {id:'toffa',fr:'TOFFA · Famille',en:'TOFFA · Family',infoFr:'Pour 2 adultes + 2 enfants · traversée incluse',infoEn:'For 2 adults + 2 children · crossing included',image:'/images/gallery/gallery-15.webp'},
 {id:'behanzin',fr:'BÉHANZIN · Groupe',en:'BÉHANZIN · Group',infoFr:'Pour 4 adultes · traversée incluse',infoEn:'For 4 adults · crossing included',image:'/images/gallery/gallery-14.webp'}
];
const steps={fr:['Votre groupe','Votre expérience','Date et arrivée','Vérifier et envoyer'],en:['Your group','Your experience','Date and arrival','Review and enquire']};
export default function ReservationPlanner({lang,intent}:{lang:Lang;intent?:{activity:string;version:number}|null}){
 const fr=lang==='fr';
 const [step,setStep]=useState(0);
 const [adults,setAdults]=useState(2);
 const [children,setChildren]=useState(0);
 const [path,setPath]=useState<'package'|'custom'|'private'>('custom');
 const [pkg,setPkg]=useState<PackageId>('guezo');
 const [lines,setLines]=useState<Line[]>([]);
 const [packageActivity,setPackageActivity]=useState<ActivityId>('canoe');
 const [gleleChoices,setGleleChoices]=useState<('canoe'|'pedalo'|'paddle')[]>(['canoe','canoe']);
 const [date,setDate]=useState('');
 const [time,setTime]=useState('14:00');
 const [name,setName]=useState('');
 const [phone,setPhone]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  if(!intent||!(ACTIVITIES as readonly string[]).includes(intent.activity))return;
  setPath('custom');setLines([{id:intent.activity as ActivityId,adults,children}]);setStep(1);
 // Intent version is the explicit trigger, not participant-counter updates.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[intent?.version]);
 const totalGuests=adults+children;
 const schedule=now?bookingWindow(now):null;
 const dateValid=!!now&&!!date&&checkBookingWindow(date,now).ok;
 const contact=validateBookingContact({fullName:name,phone});
 const eligible=packageData;
 const activePackage=pkg;
 const effectiveLines=lines.map(line=>({...line,adults:Math.min(adults,line.adults),children:Math.min(children,line.children)}));
 const model={adults,children,date,time,mode:path==='package'?'package' as const:'custom' as const,packageId:path==='package'?activePackage:undefined,lines:effectiveLines,gleleChoices:Array.from({length:totalGuests},(_,i)=>gleleChoices[i]??'canoe')};
 const quote=useMemo(()=>dateValid&&path!=='private'?validatePlan(model,now!):null,[dateValid,path,adults,children,date,time,activePackage,lines,gleleChoices,now]);
 const selected=quote?.ok?quote.quote:null;
 const packagePrice=activePackage==='glele'?adults*5000+children*3500:activePackage==='guezo'?12000:activePackage==='toffa'?18000:36000;
 const extras=effectiveLines.reduce((sum,row)=>sum+(activityAmount(row)??0),0);
 const estimated=path==='package'?packagePrice+extras:path==='custom'?extras+adults*1500+children*500:0;
 const hasInvalidLine=effectiveLines.some(row=>activityAmount(row)===null);
 const chooseActivity=(id:ActivityId)=>{
  setLines(old=>old.some(row=>row.id===id)?old.filter(row=>row.id!==id):[...old,{id,adults,children}]);
 };
 const setLineCount=(id:ActivityId,field:'adults'|'children',value:number)=>{
  setLines(old=>old.map(row=>row.id===id?{...row,[field]:Math.max(0,Math.min(field==='adults'?adults:children,value))}:row));
 };
 const changeGuests=(kind:'adults'|'children',delta:number)=>{
  if(kind==='adults')setAdults(v=>Math.max(1,Math.min(20-children,v+delta)));
  else setChildren(v=>Math.max(0,Math.min(20-adults,v+delta)));
 };
 const send=async()=>{
  if(busy||!dateValid||!contact.ok||!selected||path==='private')return;
  setBusy(true);setError('');
  try{
   const body={...model,fullName:name,phone};
   const response=await fetch('/api/reservation/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const data=await response.json() as {ok:boolean;code?:string;quote?:{total:number}};
   if(!response.ok||!data.ok||!data.quote||data.quote.total!==selected.total)throw new Error(data.code??'price_changed');
   const label=path==='package'?activePackage!.toUpperCase():(fr?'À la carte':'Custom activities');
   const detail=effectiveLines.map(line=>activityData[line.id][lang]+': '+line.adults+' '+(fr?'adulte(s)':'adult(s)')+', '+line.children+' '+(fr?'enfant(s)':'child(ren)')+' — '+money(activityAmount(line)??0));
   const message=[fr?'Bonjour AQUAMAZONE, je souhaite demander une réservation.':'Hello AQUAMAZONE, I would like to request a booking.',(fr?'Nom':'Name')+': '+name,(fr?'WhatsApp':'WhatsApp')+': '+phone,(fr?'Date':'Date')+': '+date,(fr?'Arrivée souhaitée':'Preferred arrival')+': '+time,(fr?'Participants':'Guests')+': '+adults+' '+(fr?'adultes':'adults')+', '+children+' '+(fr?'enfants (<12 ans)':'children (under 12)'),(fr?'Expérience':'Experience')+': '+label,...(path==='package'?[(fr?'Forfait':'Package')+': '+money(packagePrice)]:[]),...(path==='package'&&activePackage==='glele'?[(fr?'Choix GLÈLÈ':'GLÈLÈ choices')+': '+model.gleleChoices.join(', ')]:[]),...detail,(fr?'Traversée aller-retour':'Return crossing')+': '+(path==='package'?(fr?'Incluse':'Included'):money(adults*1500+children*500)),(fr?'Total estimé':'Estimated total')+': '+money(data.quote.total),fr?'DEMANDE NON CONFIRMÉE. Merci de confirmer les disponibilités et le prix final.':'UNCONFIRMED ENQUIRY. Please verify availability and final price.'].join('\n');
   window.location.assign(WA+encodeURIComponent(message));
  }catch{setError(fr?'Impossible de vérifier le devis. Réessayez ou contactez-nous directement.':'Could not validate the quote. Please try again or contact us directly.');setBusy(false);}
 };
 const requestPackage=()=>{
  if(totalGuests<1)return;
  const chosen=packageData.find(p=>p.id===pkg);
  const msg=[
   fr?'Bonjour AQUAMAZONE, je souhaite connaître le tarif total et les conditions d’un forfait.':'Hello AQUAMAZONE, I would like a total quote and details for a package.',
   (fr?'Forfait souhaité : ':'Requested package: ')+(chosen?.[lang]??pkg.toUpperCase()),
   (fr?'Activité souhaitée : ':'Preferred activity: ')+activityData[packageActivity][lang],
   (fr?'Adultes (12 ans et plus) : ':'Adults (12 and over): ')+adults,
   (fr?'Enfants (moins de 12 ans) : ':'Children (under 12): ')+children,
   fr?'Merci de confirmer les activités incluses, le prix total, la traversée et les disponibilités. Ceci est une demande de devis, pas une réservation.':'Please confirm included activities, total price, crossing and availability. This is a quotation request, not a confirmed booking.'
  ].join('\\n');
  window.location.assign(WA+encodeURIComponent(msg));
 };
 const openPrivate=()=>{
  const msg=fr?'Bonjour AQUAMAZONE, je souhaite organiser une sortie de groupe ou demander un devis pour une location embarcation + moteur + machiniste. Merci de me communiquer les disponibilités et conditions.':'Hello AQUAMAZONE, I would like to organize a group visit or request a boat, motor and operator rental quote. Please share availability and conditions.';
  window.location.assign(WA+encodeURIComponent(msg));
 };
 return <section id="reservation" className="reservation-v15 reservation-wizard" aria-labelledby="reservation-title">
  <div className="reservation-v15-shell">
   <div className="reservation-v15-heading">
    <p>{fr?'09 / PRÉPARER UNE VISITE':'09 / PLAN A VISIT'}</p>
    <h2 id="reservation-title">{fr?<>Votre prochaine aventure <em>commence ici.</em></>:<>Your next adventure <em>starts here.</em></>}</h2>
    <span>{fr?'Quatre étapes simples pour préparer votre sortie. Notre équipe confirmera votre demande.':'Four simple steps to plan your visit. Our team will confirm your enquiry.'}</span>
   </div>
   <div className="az-wizard-shell">
    <div className="az-wizard-top"><span>AQUAMAZONE ADVENTURE</span><span>{fr?'Étape':'Step'} {step+1} / 4</span></div>
    <div className="az-wizard-progress" aria-hidden="true">{[0,1,2,3].map(i=><span key={i} className={i<=step?'active':''}/>)}</div>
    <div className="az-wizard-content">
     <p className="az-wizard-kicker">{steps[lang][step]}</p>
     {step===0&&<>
      <h3>{fr?'Qui vient profiter de l’aventure ?':'Who is coming along?'}</h3>
      <p className="az-wizard-muted">{fr?'Indiquez votre groupe pour découvrir les expériences adaptées.':'Tell us your group size so we can recommend suitable experiences.'}</p>
      <div className="az-wizard-counter"><div><strong>{fr?'Adultes':'Adults'}</strong><small>{fr?'12 ans et plus':'Age 12 and over'}</small></div><div><button type="button" disabled={adults<=1} onClick={()=>changeGuests('adults',-1)} aria-label={fr?'Retirer un adulte':'Remove an adult'}><Minus size={17}/></button><strong>{adults}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('adults',1)} aria-label={fr?'Ajouter un adulte':'Add an adult'}><Plus size={17}/></button></div></div>
      <div className="az-wizard-counter"><div><strong>{fr?'Enfants':'Children'}</strong><small>{fr?'Moins de 12 ans':'Under 12 years'}</small></div><div><button type="button" disabled={!children} onClick={()=>changeGuests('children',-1)} aria-label={fr?'Retirer un enfant':'Remove a child'}><Minus size={17}/></button><strong>{children}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('children',1)} aria-label={fr?'Ajouter un enfant':'Add a child'}><Plus size={17}/></button></div></div>
      <p className="az-wizard-note">{totalGuests} {fr?'participant(s). Les enfants doivent être accompagnés.':'guest(s). Children must be accompanied by an adult.'}</p>
     </>}
     {step===1&&<>
      <h3>{fr?'Choisissez votre expérience':'Choose your experience'}</h3>
      <p className="az-wizard-muted">{fr?'Choisissez vos activités à la carte, ou demandez un devis personnalisé pour un forfait.':'Choose individual activities or request a personalized package quote.'}</p>
      <div className="az-wizard-tabs" role="group" aria-label={fr?'Type de visite':'Visit type'}>
       {([{id:'custom',fr:'À la carte',en:'Activities'},{id:'package',fr:'Forfaits',en:'Packages'},{id:'private',fr:'Groupes & privé',en:'Groups & private'}] as const).map(p=><button type="button" key={p.id} aria-pressed={path===p.id} className={path===p.id?'active':''} onClick={()=>setPath(p.id)}>{p[lang]}</button>)}
      </div>
      {path==='private'?<div className="az-wizard-private"><strong>{fr?'Sorties de groupe et locations sur devis':'Group visits and rentals by quotation'}</strong><p>{fr?'Pour les groupes en semaine (6 personnes minimum), événements et locations embarcation + moteur + machiniste, notre équipe prépare une proposition personnalisée.':'For weekday groups (minimum six), events, and boat/motor/operator hire, our team prepares an individual quote.'}</p><button type="button" onClick={openPrivate}>{fr?'Demander un devis sur WhatsApp':'Request a WhatsApp quote'} <ArrowRight size={17}/></button></div>:<>
       {path==='package'&&<>
        <div className="az-wizard-package-list">
         {eligible.map(item=><button type="button" key={item.id} className={'az-wizard-package az-wizard-package-text'+(activePackage===item.id?' chosen':'')} aria-pressed={activePackage===item.id} onClick={()=>setPkg(item.id)}>
          <span><strong>{item[lang]}</strong><small>{fr?item.infoFr:item.infoEn}</small><em>{fr?'Sélectionner pour demander le tarif':'Select to request a quote'}</em></span>{activePackage===item.id&&<Check size={19}/>}
         </button>)}
        </div>
        <div className="az-wizard-package-request">
         <h4>{fr?'Personnalisez votre demande':'Customize your enquiry'}</h4>
         <p>{fr?'Choisissez une activité souhaitée et indiquez vos participants. Notre équipe vérifiera le forfait adapté et vous communiquera le total.':'Choose a preferred activity and your group size. Our team will check the right package and provide the total.'}</p>
         <label>{fr?'Activité souhaitée':'Preferred activity'}
          <select value={packageActivity} onChange={e=>setPackageActivity(e.target.value as ActivityId)}>
           {ACTIVITIES.map(id=><option key={id} value={id}>{activityData[id][lang]}</option>)}
          </select>
         </label>
         <div className="az-wizard-counter"><div><strong>{fr?'Adultes':'Adults'}</strong><small>{fr?'12 ans et plus':'Age 12 and over'}</small></div><div><button type="button" disabled={adults<=1} onClick={()=>changeGuests('adults',-1)} aria-label={fr?'Retirer un adulte':'Remove an adult'}><Minus size={17}/></button><strong>{adults}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('adults',1)} aria-label={fr?'Ajouter un adulte':'Add an adult'}><Plus size={17}/></button></div></div>
         <div className="az-wizard-counter"><div><strong>{fr?'Enfants':'Children'}</strong><small>{fr?'Moins de 12 ans':'Under 12 years'}</small></div><div><button type="button" disabled={children===0} onClick={()=>changeGuests('children',-1)} aria-label={fr?'Retirer un enfant':'Remove a child'}><Minus size={17}/></button><strong>{children}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('children',1)} aria-label={fr?'Ajouter un enfant':'Add a child'}><Plus size={17}/></button></div></div>
         <p className="az-wizard-note">{fr?'Le tarif dépend du forfait et des participants. La sélection de l’activité exprime une préférence, sans modifier automatiquement les activités incluses. Aucun paiement ni réservation confirmée.':'The price depends on the package and guests. Your activity selection is a preference, not an automatic change to the package inclusions. No payment or confirmed booking.'}</p>
         <button type="button" className="az-wizard-next az-wizard-quote-button" onClick={requestPackage}><MessageCircle size={17}/>{fr?'Nous contacter pour le tarif total':'Ask us for the total price'} <ArrowRight size={17}/></button>
        </div>
       </>}
       {path==='custom'&&       <div className="az-wizard-activities">
        {ACTIVITIES.map(activity=>{
         const d=activityData[activity],line=effectiveLines.find(x=>x.id===activity);
         const total=line?activityAmount(line):null;
         return <div key={activity} className={'az-wizard-activity'+(line?' chosen':'')}>
          <button type="button" className="az-wizard-activity-toggle" aria-pressed={!!line} onClick={()=>chooseActivity(activity)}>
           <img src={d.image} alt="" loading="lazy"/><span><strong>{d[lang]}</strong><small>{d.duration} · {d.hint}</small></span><span className="az-wizard-plus">{line?<Check size={18}/>:<Plus size={18}/>}</span>
          </button>
          {line&&<div className="az-wizard-participants">
           <span>{fr?'Qui participe ?':'Who participates?'}</span>
           {(['adults','children'] as const).map(field=><div key={field}><span>{field==='adults'?(fr?'Adultes':'Adults'):(fr?'Enfants':'Children')}</span><button type="button" disabled={line[field]<=0} onClick={()=>setLineCount(activity,field,line[field]-1)} aria-label={fr?'Retirer un participant':'Remove participant'}><Minus size={14}/></button><b>{line[field]}</b><button type="button" disabled={line[field]>=(field==='adults'?adults:children)} onClick={()=>setLineCount(activity,field,line[field]+1)} aria-label={fr?'Ajouter un participant':'Add participant'}><Plus size={14}/></button></div>)}
           <strong>{total===null?(fr?'Participants incompatibles':'Invalid participant count'):money(total)}</strong>
           {total===null&&<small role="alert">{fr?'Le bateau à pédales demande 2 à 4 participants. Chaque activité demande au moins une personne.':'Pedal boat requires 2–4 participants. Other activities require at least one.'}</small>}
          </div>}
         </div>})}
       </div>}
      </>}
     </>}
     {step===2&&<>
      <h3>{fr?'Quand souhaitez-vous venir ?':'When would you like to visit?'}</h3>
      <p className="az-wizard-muted">{fr?'Les demandes en ligne concernent le prochain week-end. Les jours fériés et sorties en semaine sont organisés via WhatsApp.':'Online enquiries cover the next weekend. Public holidays and weekday groups are arranged via WhatsApp.'}</p>
      <div className="az-wizard-days">
       {schedule?[schedule.saturday,schedule.sunday].map((day,i)=>{const ok=!!now&&checkBookingWindow(day,now).ok;return <button key={day} type="button" disabled={!ok} className={date===day?'chosen':''} onClick={()=>setDate(day)} aria-pressed={date===day}><strong>{i===0?(fr?'Samedi':'Saturday'):(fr?'Dimanche':'Sunday')}</strong><span>{day}</span><small>{ok?(fr?'Demande possible':'Enquiries open'):(fr?'Clôturé':'Closed')}</small></button>}):<p>{fr?'Chargement du calendrier…':'Loading calendar…'}</p>}
      </div>
      <label className="az-wizard-date-label">{fr?'Heure d’arrivée souhaitée':'Preferred arrival time'}<select value={time} onChange={e=>setTime(e.target.value)}>{RESERVATION_SLOTS.map(slot=><option key={slot} value={slot}>{slot}</option>)}</select></label>
      <p className="az-wizard-note">{fr?'L’heure d’arrivée n’est pas un créneau d’activité garanti. Les demandes ferment à 23h59 la veille, heure du Bénin.':'Your arrival time is not a guaranteed activity slot. Enquiries close at 11:59pm the preceding day, Benin time.'}</p>
     </>}
     {step===3&&<>
      <h3>{fr?'Vérifiez votre demande':'Review your enquiry'}</h3>
      <p className="az-wizard-muted">{fr?'Votre prix reste indicatif jusqu’à validation par notre équipe.':'Your price is an estimate until our team verifies availability.'}</p>
      <div className="az-wizard-recap">
       <div><span>{fr?'Participants':'Guests'}</span><strong>{adults} {fr?'adulte(s)':'adult(s)'}, {children} {fr?'enfant(s)':'child(ren)'}</strong></div>
       <div><span>{fr?'Date · arrivée':'Date · arrival'}</span><strong>{date} · {time}</strong></div>
       {path==='package'&&<div><span>{fr?'Forfait':'Package'} {activePackage?.toUpperCase()}</span><strong>{money(packagePrice)}</strong></div>}
       {effectiveLines.map(line=><div key={line.id}><span>{activityData[line.id][lang]} ({line.adults}+{line.children})</span><strong>{money(activityAmount(line)??0)}</strong></div>)}
       <div><span>{fr?'Traversée aller-retour':'Return crossing'}</span><strong>{path==='package'?(fr?'Incluse':'Included'):money(adults*1500+children*500)}</strong></div>
       <div className="az-wizard-total"><strong>{fr?'Total estimé':'Estimated total'}</strong><strong>{money(estimated)}</strong></div>
      </div>
      <p className="az-wizard-note">{fr?'Estimation → Demande WhatsApp → Confirmation par l’équipe. Aucune réservation ni paiement ne sont confirmés ici.':'Estimate → WhatsApp enquiry → Team confirmation. No booking or payment is confirmed here.'}</p>
      <div className="az-wizard-contact"><label>{fr?'Nom et prénom':'Full name'}<input value={name} maxLength={100} autoComplete="name" onChange={e=>setName(e.target.value)} placeholder={fr?'Votre nom complet':'Your full name'}/></label><label>{fr?'Numéro WhatsApp international':'International WhatsApp number'}<input value={phone} maxLength={32} type="tel" autoComplete="tel" onChange={e=>setPhone(e.target.value)} placeholder="+229 01 00 00 00 00"/></label></div>
      {error&&<p role="alert" className="az-wizard-error">{error}</p>}
      <p className="az-wizard-muted">{fr?'Le bouton ouvre WhatsApp avec votre demande préremplie. Vous devez encore envoyer le message dans WhatsApp.':'The button opens WhatsApp with a prepared enquiry. You must still send the message inside WhatsApp.'}</p>
     </>}
     <div className="az-wizard-actions">
      <button type="button" className="az-wizard-back" disabled={step===0||busy} onClick={()=>{setError('');setStep(s=>Math.max(0,s-1));}}><ArrowLeft size={17}/>{fr?'Retour':'Back'}</button>
      {step<3?<button type="button" className="az-wizard-next" disabled={step===1&&(path!=='custom'||hasInvalidLine||effectiveLines.length===0)||step===2&&!dateValid} onClick={()=>setStep(s=>Math.min(3,s+1))}>{fr?'Continuer':'Continue'} <ArrowRight size={17}/></button>:<button type="button" className="az-wizard-next" disabled={!contact.ok||!selected||busy} onClick={send}><MessageCircle size={17}/>{busy?(fr?'Vérification…':'Validating…'):(fr?'Continuer sur WhatsApp':'Continue on WhatsApp')}</button>}
     </div>
    </div>
    {step>0&&step<3&&path==='custom'&&<div className="az-wizard-summary"><span>{fr?'Estimation actuelle':'Current estimate'}</span><strong>{money(estimated)}</strong><small>{fr?'Traversée comprise dans ce total':'Crossing included in this total'}</small></div>}
   </div>
  </div>
 </section>;
}
