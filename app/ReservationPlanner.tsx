'use client';

import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Minus,Plus,MessageCircle} from 'lucide-react';
import {reservationLabel,type SiteLanguage} from '../lib/reservation-i18n';
import {bookingWindow,checkBookingWindow,RESERVATION_SLOTS} from '../lib/reservation-rules';
import {validateBookingContact} from '../lib/booking-contact';
import {ACTIVITIES,isPackageEligible,validatePlan,activityAmount,type ActivityId,type PackageId,type Line} from '../lib/reservation-plan';

type Lang=SiteLanguage;
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
function CrossingBreakdown({adults,children,lang,included=false}:{adults:number;children:number;lang:Lang;included?:boolean}){
 const fr=lang!=='en';const tr=(en:string,frText:string)=>reservationLabel(lang,en,frText);
 const adultAmount=adults*1500,childAmount=children*500;
 return <div className="az-wizard-crossing" aria-live="polite" aria-label={tr("Return crossing pricing","Tarif de la traversée aller-retour")}>
  <div className="az-wizard-crossing-heading">
   <strong>{tr("Pirogue crossing · Return trip","Traversée en pirogue · Aller-retour")}</strong>
   <small>{tr("Adult: 1,500 FCFA · Child under 12: 500 FCFA","Adulte : 1 500 FCFA · Enfant de moins de 12 ans : 500 FCFA")}</small>
  </div>
  <div className="az-wizard-crossing-line"><span>{tr("Adults","Adultes")} · {adults} × 1 500 FCFA</span><strong>{money(adultAmount)}</strong></div>
  <div className="az-wizard-crossing-line"><span>{tr("Children","Enfants")} · {children} × 500 FCFA</span><strong>{money(childAmount)}</strong></div>
  <div className="az-wizard-crossing-total"><span>{tr("Crossing total","Total traversée")}</span><strong>{money(adultAmount+childAmount)}</strong></div>
  <p>{included?(tr("This amount is already covered by packages that include the crossing and will not be charged twice. Our team will confirm the chosen package and its price.","Ce montant est déjà compris dans les forfaits qui incluent la traversée : il ne sera pas ajouté une deuxième fois. Le forfait choisi et son tarif seront confirmés par notre équipe.")):(tr("This amount is added only once to à-la-carte activities. If you choose a package that includes the crossing, it will not be charged again.","Ce montant sera ajouté une seule fois aux activités à la carte. Si vous choisissez ensuite un forfait incluant la traversée, elle ne sera pas facturée en supplément."))}</p>
 </div>;
}
export default function ReservationPlanner({lang,intent}:{lang:Lang;intent?:{activity:string;version:number}|null}){
 const fr=lang!=='en';
 const contentLang: 'fr'|'en'=lang==='en'?'en':'fr';
 const tr=(en:string,frText:string)=>reservationLabel(lang,en,frText);
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
   const visitDate=new Intl.DateTimeFormat(fr?'fr-FR':'en-GB',{
    weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'
   }).format(new Date(date+'T12:00:00Z'));
   const arrival=time.replace(':','h');
   const participants=[
    (fr?'Adultes : ':'Adults: ')+adults,
    (fr?'Enfants (moins de 12 ans) : ':'Children (under 12): ')+children
   ];
   const detail=effectiveLines.map(line=>{
    const people=[
     line.adults?line.adults+' '+(fr?(line.adults===1?'adulte':'adultes'):(line.adults===1?'adult':'adults')):'',
     line.children?line.children+' '+(fr?(line.children===1?'enfant':'enfants'):(line.children===1?'child':'children')):''
    ].filter(Boolean).join(', ');
    return '• '+activityData[line.id][contentLang]+' — '+people+' : '+money(activityAmount(line)??0);
   });
   const packageLines=path==='package'?[
    '*'+(fr?'Forfait choisi':'Selected package')+'*',
    activePackage!.toUpperCase()+' : '+money(packagePrice),
    ...(activePackage==='glele'?[(fr?'Activités incluses : ':'Included activities: ')+model.gleleChoices.map(a=>activityData[a][contentLang]).join(', ')]:[]),
    ''
   ]:[];
   const crossingLabel=path==='package'
    ?(fr?'Traversée aller-retour : incluse':'Return crossing: included')
    :(fr?'Traversée aller-retour':'Return crossing')+' ('+adults+' × 1 500'+(children?' + '+children+' × 500':'')+') : '+money(adults*1500+children*500);
   const message=[
    '*'+(fr?'DEMANDE DE RÉSERVATION':'BOOKING REQUEST')+' — AQUAMAZONE ADVENTURE*',
    '',
    '*'+(fr?'Coordonnées du client':'Customer details')+'*',
    (fr?'Nom : ':'Name: ')+contact.contact.fullName,
    (fr?'Téléphone / WhatsApp : ':'Phone / WhatsApp: ')+contact.contact.phone,
    '',
    '*'+(fr?'Personnes':'Guests')+'*',
    ...participants,
    '',
    '*'+(fr?'Date et arrivée':'Date and arrival')+'*',
    (fr?'Date : ':'Date: ')+visitDate.charAt(0).toUpperCase()+visitDate.slice(1),
    (fr?'Heure d’arrivée souhaitée : ':'Preferred arrival time: ')+arrival,
    '',
    ...packageLines,
    '*'+(fr?'Activités choisies':'Selected activities')+'*',
    ...detail,
    '',
    '*'+(fr?'Récapitulatif des tarifs':'Price summary')+'*',
    crossingLabel,
    '*'+(fr?'Total estimé : ':'Estimated total: ')+money(data.quote.total)+'*',
    '',
    fr?'Merci de nous confirmer la disponibilité des activités ainsi que le montant final de la réservation.':'Please confirm activity availability and the final booking amount.',
    '_'+(fr?'Demande en attente de confirmation. Aucun paiement effectué.':'Enquiry awaiting confirmation. No payment has been made.')+'_'
   ].join('\n');
   window.location.assign(WA+encodeURIComponent(message));
  }catch{setError(fr?'Impossible de vérifier le devis. Réessayez ou contactez-nous directement.':'Could not validate the quote. Please try again or contact us directly.');setBusy(false);}
 };
 const requestPackage=()=>{
  if(totalGuests<1)return;
  const chosen=packageData.find(p=>p.id===pkg);
  const msg=[
   fr?'Bonjour AQUAMAZONE, je souhaite connaître le tarif total et les conditions d’un forfait.':'Hello AQUAMAZONE, I would like a total quote and details for a package.',
   (fr?'Forfait souhaité : ':'Requested package: ')+(chosen?.[contentLang]??pkg.toUpperCase()),
   (fr?'Activité souhaitée : ':'Preferred activity: ')+activityData[packageActivity][contentLang],
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
    <p>{tr("09 / PLAN A VISIT","09 / PRÉPARER UNE VISITE")}</p>
    <h2 id="reservation-title">{lang==='es'?<>Tu próxima aventura <em>comienza aquí.</em></>:lang==='hi'?<>आपका अगला रोमांच <em>यहीं शुरू होता है।</em></>:fr?<>Votre prochaine aventure <em>commence ici.</em></>:<>Your next adventure <em>starts here.</em></>}</h2>
    <span>{tr("Four simple steps to plan your visit. Our team will confirm your enquiry.","Quatre étapes simples pour préparer votre sortie. Notre équipe confirmera votre demande.")}</span>
   </div>
   <div className="az-wizard-shell">
    <div className="az-wizard-top"><span>AQUAMAZONE ADVENTURE</span><span>{tr("Step","Étape")} {step+1} / 4</span></div>
    <div className="az-wizard-progress" aria-hidden="true">{[0,1,2,3].map(i=><span key={i} className={i<=step?'active':''}/>)}</div>
    <div className="az-wizard-content">
     <p className="az-wizard-kicker">{tr(steps.en[step],steps.fr[step])}</p>
     {step===0&&<>
      <h3>{tr("Who is coming along?","Qui vient profiter de l’aventure ?")}</h3>
      <p className="az-wizard-muted">{tr("Tell us your group size so we can recommend suitable experiences.","Indiquez votre groupe pour découvrir les expériences adaptées.")}</p>
      <div className="az-wizard-counter"><div><strong>{tr("Adults","Adultes")}</strong><small>{tr("Age 12 and over","12 ans et plus")}</small></div><div><button type="button" disabled={adults<=1} onClick={()=>changeGuests('adults',-1)} aria-label={tr("Remove an adult","Retirer un adulte")}><Minus size={17}/></button><strong>{adults}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('adults',1)} aria-label={tr("Add an adult","Ajouter un adulte")}><Plus size={17}/></button></div></div>
      <div className="az-wizard-counter"><div><strong>{tr("Children","Enfants")}</strong><small>{tr("Under 12 years","Moins de 12 ans")}</small></div><div><button type="button" disabled={!children} onClick={()=>changeGuests('children',-1)} aria-label={tr("Remove a child","Retirer un enfant")}><Minus size={17}/></button><strong>{children}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('children',1)} aria-label={tr("Add a child","Ajouter un enfant")}><Plus size={17}/></button></div></div>
      <p className="az-wizard-note">{totalGuests} {tr("guest(s). Children must be accompanied by an adult.","participant(s). Les enfants doivent être accompagnés.")}</p>
      <CrossingBreakdown adults={adults} children={children} lang={lang}/>
     </>}
     {step===1&&<>
      <h3>{tr("Choose your experience","Choisissez votre expérience")}</h3>
      <p className="az-wizard-muted">{tr("Choose individual activities or request a personalized package quote.","Choisissez vos activités à la carte, ou demandez un devis personnalisé pour un forfait.")}</p>
      <div className="az-wizard-tabs" role="group" aria-label={tr("Visit type","Type de visite")}>
       {([{id:'custom',fr:'À la carte',en:'Activities'},{id:'package',fr:'Forfaits',en:'Packages'},{id:'private',fr:'Groupes & privé',en:'Groups & private'}] as const).map(p=><button type="button" key={p.id} aria-pressed={path===p.id} className={path===p.id?'active':''} onClick={()=>setPath(p.id)}>{tr(p.en,p.fr)}</button>)}
      </div>
      {path==='private'?<div className="az-wizard-private"><strong>{tr("Group visits and rentals by quotation","Sorties de groupe et locations sur devis")}</strong><p>{tr("For weekday groups (minimum six), events, and boat/motor/operator hire, our team prepares an individual quote.","Pour les groupes en semaine (6 personnes minimum), événements et locations embarcation + moteur + machiniste, notre équipe prépare une proposition personnalisée.")}</p><button type="button" onClick={openPrivate}>{tr("Request a WhatsApp quote","Demander un devis sur WhatsApp")} <ArrowRight size={17}/></button></div>:<>
       {path==='package'&&<>
        <div className="az-wizard-package-list">
         {eligible.map(item=><button type="button" key={item.id} className={'az-wizard-package az-wizard-package-text'+(activePackage===item.id?' chosen':'')} aria-pressed={activePackage===item.id} onClick={()=>setPkg(item.id)}>
          <span><strong>{tr(item.en,item.fr)}</strong><small>{tr(item.infoEn,item.infoFr)}</small><em>{tr("Select to request a quote","Sélectionner pour demander le tarif")}</em></span>{activePackage===item.id&&<Check size={19}/>}
         </button>)}
        </div>
        <div className="az-wizard-package-request">
         <h4>{tr("Customize your enquiry","Personnalisez votre demande")}</h4>
         <p>{tr("Choose a preferred activity and your group size. Our team will check the right package and provide the total.","Choisissez une activité souhaitée et indiquez vos participants. Notre équipe vérifiera le forfait adapté et vous communiquera le total.")}</p>
         <label>{tr("Preferred activity","Activité souhaitée")}
          <select value={packageActivity} onChange={e=>setPackageActivity(e.target.value as ActivityId)}>
           {ACTIVITIES.map(id=><option key={id} value={id}>{tr(activityData[id].en,activityData[id].fr)}</option>)}
          </select>
         </label>
         <div className="az-wizard-counter"><div><strong>{tr("Adults","Adultes")}</strong><small>{tr("Age 12 and over","12 ans et plus")}</small></div><div><button type="button" disabled={adults<=1} onClick={()=>changeGuests('adults',-1)} aria-label={tr("Remove an adult","Retirer un adulte")}><Minus size={17}/></button><strong>{adults}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('adults',1)} aria-label={tr("Add an adult","Ajouter un adulte")}><Plus size={17}/></button></div></div>
         <div className="az-wizard-counter"><div><strong>{tr("Children","Enfants")}</strong><small>{tr("Under 12 years","Moins de 12 ans")}</small></div><div><button type="button" disabled={children===0} onClick={()=>changeGuests('children',-1)} aria-label={tr("Remove a child","Retirer un enfant")}><Minus size={17}/></button><strong>{children}</strong><button type="button" disabled={totalGuests>=20} onClick={()=>changeGuests('children',1)} aria-label={tr("Add a child","Ajouter un enfant")}><Plus size={17}/></button></div></div>
         <CrossingBreakdown adults={adults} children={children} lang={lang} included/>
         <p className="az-wizard-note">{tr("The price depends on the package and guests. Your activity selection is a preference, not an automatic change to the package inclusions. No payment or confirmed booking.","Le tarif dépend du forfait et des participants. La sélection de l’activité exprime une préférence, sans modifier automatiquement les activités incluses. Aucun paiement ni réservation confirmée.")}</p>
         <button type="button" className="az-wizard-next az-wizard-quote-button" onClick={requestPackage}><MessageCircle size={17}/>{tr("Ask us for the total price","Nous contacter pour le tarif total")} <ArrowRight size={17}/></button>
        </div>
       </>}
       {path==='custom'&&       <div className="az-wizard-activities">
        {ACTIVITIES.map(activity=>{
         const d=activityData[activity],line=effectiveLines.find(x=>x.id===activity);
         const total=line?activityAmount(line):null;
         return <div key={activity} className={'az-wizard-activity'+(line?' chosen':'')}>
          <button type="button" className="az-wizard-activity-toggle" aria-pressed={!!line} onClick={()=>chooseActivity(activity)}>
           <img src={d.image} alt="" loading="lazy"/><span><strong>{tr(d.en,d.fr)}</strong><small>{d.duration} · {d.hint}</small></span><span className="az-wizard-plus">{line?<Check size={18}/>:<Plus size={18}/>}</span>
          </button>
          {line&&<div className="az-wizard-participants">
           <span>{tr("Who participates?","Qui participe ?")}</span>
           {(['adults','children'] as const).map(field=><div key={field}><span>{field==='adults'?(fr?'Adultes':'Adults'):(fr?'Enfants':'Children')}</span><button type="button" disabled={line[field]<=0} onClick={()=>setLineCount(activity,field,line[field]-1)} aria-label={tr("Remove participant","Retirer un participant")}><Minus size={14}/></button><b>{line[field]}</b><button type="button" disabled={line[field]>=(field==='adults'?adults:children)} onClick={()=>setLineCount(activity,field,line[field]+1)} aria-label={tr("Add participant","Ajouter un participant")}><Plus size={14}/></button></div>)}
           <strong>{total===null?(fr?'Participants incompatibles':'Invalid participant count'):money(total)}</strong>
           {total===null&&<small role="alert">{tr("Pedal boat requires 2–4 participants. Other activities require at least one.","Le bateau à pédales demande 2 à 4 participants. Chaque activité demande au moins une personne.")}</small>}
          </div>}
         </div>})}
       </div>}
      </>}
     </>}
     {step===2&&<>
      <h3>{tr("When would you like to visit?","Quand souhaitez-vous venir ?")}</h3>
      <p className="az-wizard-muted">{tr("Online enquiries cover the next weekend. Public holidays and weekday groups are arranged via WhatsApp.","Les demandes en ligne concernent le prochain week-end. Les jours fériés et sorties en semaine sont organisés via WhatsApp.")}</p>
      <div className="az-wizard-days">
       {schedule?[schedule.saturday,schedule.sunday].map((day,i)=>{const ok=!!now&&checkBookingWindow(day,now).ok;return <button key={day} type="button" disabled={!ok} className={date===day?'chosen':''} onClick={()=>setDate(day)} aria-pressed={date===day}><strong>{i===0?tr('Saturday','Samedi'):tr('Sunday','Dimanche')}</strong><span>{day}</span><small>{ok?tr('Enquiries open','Demande possible'):tr('Closed','Clôturé')}</small></button>}):<p>{tr("Loading calendar…","Chargement du calendrier…")}</p>}
      </div>
      <label className="az-wizard-date-label">{tr("Preferred arrival time","Heure d’arrivée souhaitée")}<select value={time} onChange={e=>setTime(e.target.value)}>{RESERVATION_SLOTS.map(slot=><option key={slot} value={slot}>{slot}</option>)}</select></label>
      <p className="az-wizard-note">{tr("Your arrival time is not a guaranteed activity slot. Enquiries close at 11:59pm the preceding day, Benin time.","L’heure d’arrivée n’est pas un créneau d’activité garanti. Les demandes ferment à 23h59 la veille, heure du Bénin.")}</p>
     </>}
     {step===3&&<>
      <h3>{tr("Review your enquiry","Vérifiez votre demande")}</h3>
      <p className="az-wizard-muted">{tr("Your price is an estimate until our team verifies availability.","Votre prix reste indicatif jusqu’à validation par notre équipe.")}</p>
      <div className="az-wizard-recap">
       <div><span>{tr("Guests","Participants")}</span><strong>{adults} {tr("adult(s)","adulte(s)")}, {children} {tr("child(ren)","enfant(s)")}</strong></div>
       <div><span>{tr("Date · arrival","Date · arrivée")}</span><strong>{date} · {time}</strong></div>
       {path==='package'&&<div><span>{tr("Package","Forfait")} {activePackage?.toUpperCase()}</span><strong>{money(packagePrice)}</strong></div>}
       {effectiveLines.map(line=><div key={line.id}><span>{tr(activityData[line.id].en,activityData[line.id].fr)} ({line.adults}+{line.children})</span><strong>{money(activityAmount(line)??0)}</strong></div>)}
       <div><span>{tr("Return crossing","Traversée aller-retour")}</span><strong>{path==='package'?tr('Included','Incluse'):money(adults*1500+children*500)}</strong></div>
       <div className="az-wizard-total"><strong>{tr("Estimated total","Total estimé")}</strong><strong>{money(estimated)}</strong></div>
      </div>
      <p className="az-wizard-note">{tr("Estimate → WhatsApp enquiry → Team confirmation. No booking or payment is confirmed here.","Estimation → Demande WhatsApp → Confirmation par l’équipe. Aucune réservation ni paiement ne sont confirmés ici.")}</p>
      <div className="az-wizard-contact"><label>{tr("Full name","Nom et prénom")}<input value={name} maxLength={100} autoComplete="name" onChange={e=>setName(e.target.value)} placeholder={tr("Your full name","Votre nom complet")}/></label><label>{tr("International WhatsApp number","Numéro WhatsApp international")}<input value={phone} maxLength={32} type="tel" autoComplete="tel" onChange={e=>setPhone(e.target.value)} placeholder="+229 01 00 00 00 00"/></label></div>
      {error&&<p role="alert" className="az-wizard-error">{error}</p>}
      <p className="az-wizard-muted">{tr("The button opens WhatsApp with a prepared enquiry. You must still send the message inside WhatsApp.","Le bouton ouvre WhatsApp avec votre demande préremplie. Vous devez encore envoyer le message dans WhatsApp.")}</p>
     </>}
     <div className="az-wizard-actions">
      <button type="button" className="az-wizard-back" disabled={step===0||busy} onClick={()=>{setError('');setStep(s=>Math.max(0,s-1));}}><ArrowLeft size={17}/>{tr("Back","Retour")}</button>
      {step<3?<button type="button" className="az-wizard-next" disabled={step===1&&(path!=='custom'||hasInvalidLine||effectiveLines.length===0)||step===2&&!dateValid} onClick={()=>setStep(s=>Math.min(3,s+1))}>{tr("Continue","Continuer")} <ArrowRight size={17}/></button>:<button type="button" className="az-wizard-next" disabled={!contact.ok||!selected||busy} onClick={send}><MessageCircle size={17}/>{busy?tr('Validating…','Vérification…'):tr('Continue on WhatsApp','Continuer sur WhatsApp')}</button>}
     </div>
    </div>
    {step>0&&step<3&&path==='custom'&&<div className="az-wizard-summary"><span>{tr("Current estimate","Estimation actuelle")}</span><strong>{money(estimated)}</strong><small>{tr("Crossing included in this total","Traversée comprise dans ce total")}</small></div>}
   </div>
  </div>
 </section>;
}
