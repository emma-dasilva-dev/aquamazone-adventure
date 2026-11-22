'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,Check,Star} from 'lucide-react';
import {reviewText} from '../lib/reviews-i18n';
import type {SiteLanguage} from '../lib/reservation-i18n';
import type {DiscoverySource,PublicReview} from '../lib/visitor-reviews';

type Lang=SiteLanguage;
const sourceNames:Record<DiscoverySource,{fr:string;en:string}>={
 social:{fr:'Réseaux sociaux',en:'Social media'},friends:{fr:'Amis ou famille',en:'Friends or family'},
 search:{fr:'Recherche / Google Maps',en:'Search / Google Maps'},nearby:{fr:'En passant à proximité',en:'Passing nearby'},
 other:{fr:'Autre',en:'Other'}
};
const sources=Object.keys(sourceNames) as DiscoverySource[];

export default function VisitorReviews({lang}:{lang:Lang}){
 const fr=lang==='fr'||lang==='fon';
 const tr=(en:string,frText:string)=>reviewText(lang,en,frText);
 const [reviews,setReviews]=useState<PublicReview[]>([]);
 const [enabled,setEnabled]=useState(false);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState('');
 const [comment,setComment]=useState('');
 const [source,setSource]=useState<DiscoverySource>('other');
 const [rating,setRating]=useState(0);
 const [consent,setConsent]=useState(false);
 const [website,setWebsite]=useState('');
 const [sending,setSending]=useState(false);
 const [success,setSuccess]=useState(false);
 const [error,setError]=useState('');
 const [promptVisible,setPromptVisible]=useState(false);
 const [step,setStep]=useState<'rating'|'details'>('rating');

 useEffect(()=>{
  let active=true;
  fetch('/api/reviews',{cache:'no-store'}).then(r=>r.json()).then(data=>{
   if(active){setEnabled(data.ok===true&&data.enabled===true);setReviews(Array.isArray(data.reviews)?data.reviews:[]);}
  }).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false};
 },[]);

 useEffect(()=>{
  const node=document.getElementById('avis');
  if(!node||typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting))setPromptVisible(true);
  },{threshold:0.15});
  observer.observe(node);
  return()=>observer.disconnect();
 },[]);

 const submit=async(event:FormEvent)=>{
  event.preventDefault();
  if(!enabled||sending||!consent||rating===0)return;
  setSending(true);setError('');
  try{
   const response=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:name.trim()||'Visiteur',comment,source,rating,consent,website})});
   const data=await response.json();
   if(!response.ok||data.ok!==true)throw Error(String(data.code??'error'));
   setSuccess(true);setName('');setComment('');setRating(0);setConsent(false);setStep('rating');
  }catch(e){
   const code=e instanceof Error?e.message:'';
   setError(code==='rate_limit'?(tr('A review was submitted recently. Please try later.','Une contribution a déjà été envoyée récemment. Réessayez plus tard.')):
    tr('Could not submit your review. Check the fields or try again later.','Impossible d’envoyer votre avis. Vérifiez les champs ou réessayez plus tard.'));
  }finally{setSending(false)}
 };

 return <section id="avis" className="visitor-reviews" aria-labelledby="visitor-reviews-title">
  <div className="visitor-reviews-shell">
   <div className="visitor-reviews-heading">
    <span>{tr("10 / VISITOR STORIES","10 / PAROLES DE VISITEURS")}</span>
    <h2 id="visitor-reviews-title">{tr('Your adventure, ','Votre aventure, ')}<em>{tr('your words.','vos mots.')}</em></h2>
    <p>{tr("Visited Aquamazone? Share your experience and tell us how you found us.","Vous avez visité Aquamazone ? Racontez votre expérience et dites-nous comment vous nous avez découverts.")}</p>
   </div>

   <div className="visitor-reviews-grid">
    <div className="visitor-reviews-public">
     <div className="visitor-reviews-subheading"><h3>{tr("Visitor reviews","Les avis de nos visiteurs")}</h3><span>{tr("Approved reviews","Avis approuvés")}</span></div>
     {loading?<p className="visitor-reviews-empty">{tr("Loading reviews…","Chargement des avis…")}</p>:
      reviews.length===0?<div className="visitor-reviews-empty"><p>{tr("The first visitor stories will appear here after moderation.","Les premiers témoignages seront publiés ici après modération.")}</p></div>:
      <div className="visitor-reviews-list">{reviews.map(r=><article className="visitor-review" key={r.id}>
       <div className="visitor-review-head"><strong>{r.name}</strong><time dateTime={r.createdAt}>{new Intl.DateTimeFormat(lang==='en'?'en-GB':lang==='es'?'es-ES':lang==='hi'?'hi-IN':'fr-FR',{month:'short',year:'numeric'}).format(new Date(r.createdAt))}</time></div>
       {r.rating!==null&&<div className="visitor-review-stars" aria-label={tr(r.rating+' out of 5 stars',r.rating+' étoiles sur 5')}>{Array.from({length:5},(_,i)=><Star key={i} size={14} fill={i<(r.rating??0)!?'currentColor':'none'} aria-hidden="true"/>)}</div>}
       {r.comment&&<p>{r.comment}</p>}
       <span>{tr("Discovered via: ","Découverte : ")}{tr(sourceNames[r.source]?.en??sourceNames.other.en,sourceNames[r.source]?.fr??sourceNames.other.fr)}</span>
      </article>)}</div>}
    </div>

    <div className="visitor-reviews-form-area">
     <h3>{tr("Share your experience","Partagez votre expérience")}</h3>
     <p>{tr("Your feedback helps us improve every visit.","Votre retour nous aide à améliorer chaque visite.")}</p>
     {!loading&&!enabled?<div className="visitor-reviews-disabled" role="status">{tr("The review form will be available soon.","Le formulaire d’avis sera bientôt disponible.")}</div>:
      success?<div className="visitor-reviews-success" role="status">
       <Check size={24}/><strong>{tr("Thank you for your feedback!","Merci pour votre retour !")}</strong>
       <p>{tr("Your review was received and will be checked before publication.","Votre avis a été reçu et sera examiné avant sa publication.")}</p>
       <button type="button" onClick={()=>setSuccess(false)}>{tr("Write another review","Écrire un autre avis")}</button>
      </div>:
      <div className={'visitor-rating-experience'+(promptVisible?' is-visible':'')}>
       {step==='rating'?<div className="visitor-rating-invite">
        <span className="visitor-rating-kicker">{tr("YOUR OPINION MATTERS","VOTRE AVIS COMPTE")}</span>
        <strong>{tr("How was your visit?","Comment était votre visite ?")}</strong>
        <p>{tr("Tap a star to rate your experience.","Touchez une étoile pour donner votre note.")}</p>
        <div className="visitor-rating-choices" role="group" aria-label={tr("Rate your visit out of five","Noter votre visite sur cinq")}>
         {[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={n+' '+tr(n>1?'stars':'star',n>1?'étoiles':'étoile')} onClick={()=>{setRating(n);setStep('details');setError('')}}><Star size={30} aria-hidden="true"/></button>)}
        </div>
       </div>:
       <form onSubmit={submit} className="visitor-reviews-form visitor-reviews-form-progressive">
        <div className="visitor-rating-selected">
         <span>{tr("Your rating","Votre note")}</span>
         <div role="group" aria-label={tr("Change rating","Modifier la note")}>{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={n+' '+tr('stars','étoiles')} aria-pressed={rating===n} onClick={()=>setRating(n)}><Star size={23} fill={n<=rating?'currentColor':'none'} aria-hidden="true"/></button>)}</div>
        </div>
        <label>{tr("A comment? (optional)","Un commentaire ? (facultatif)")}<textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={1000} rows={4} placeholder={tr("Tell us about your experience, if you wish…","Racontez votre expérience, si vous le souhaitez…")}/><small>{comment.length} / 1000</small></label>
        <label>{tr("Your name (optional)","Votre prénom ou nom (facultatif)")}<input value={name} onChange={e=>setName(e.target.value)} maxLength={60} autoComplete="name" placeholder={tr("Visitor","Visiteur")}/></label>
        <label>{tr("How did you hear about us? (optional)","Comment nous avez-vous connus ? (facultatif)")}<select value={source} onChange={e=>setSource(e.target.value as DiscoverySource)}><option value="other">{tr("Prefer not to say","Je préfère ne pas préciser")}</option>{sources.filter(s=>s!=='other').map(s=><option key={s} value={s}>{tr(sourceNames[s].en,sourceNames[s].fr)}</option>)}</select></label>
        <div className="visitor-reviews-honeypot" aria-hidden="true"><label>Website<input value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label></div>
        <label className="visitor-reviews-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>{tr("I agree to publication of my rating, optional comment and display name after team approval.","J’accepte la publication de ma note, de mon commentaire éventuel et du nom affiché, après validation par l’équipe.")}</span></label>
        {error&&<p className="visitor-reviews-error" role="alert">{error}</p>}
        <button className="visitor-reviews-submit" disabled={sending||!enabled||!consent} type="submit">{sending?tr('Submitting…','Envoi en cours…'):tr('Submit my review','Envoyer mon avis')}<ArrowRight size={18}/></button>
       </form>}
      </div>}
    </div>
   </div>
  </div>
 </section>;
}
