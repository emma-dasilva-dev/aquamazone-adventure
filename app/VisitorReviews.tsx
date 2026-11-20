'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowRight,Check,Star} from 'lucide-react';
import type {DiscoverySource,PublicReview} from '../lib/visitor-reviews';

type Lang='fr'|'en';
const sourceNames:Record<DiscoverySource,{fr:string;en:string}>={
 social:{fr:'Réseaux sociaux',en:'Social media'},friends:{fr:'Amis ou famille',en:'Friends or family'},
 search:{fr:'Recherche / Google Maps',en:'Search / Google Maps'},nearby:{fr:'En passant à proximité',en:'Passing nearby'},
 other:{fr:'Autre',en:'Other'}
};
const sources=Object.keys(sourceNames) as DiscoverySource[];
export default function VisitorReviews({lang}:{lang:Lang}){
 const fr=lang==='fr';
 const [reviews,setReviews]=useState<PublicReview[]>([]);
 const [enabled,setEnabled]=useState(false);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState('');
 const [comment,setComment]=useState('');
 const [source,setSource]=useState<DiscoverySource>('friends');
 const [rating,setRating]=useState(0);
 const [consent,setConsent]=useState(false);
 const [website,setWebsite]=useState('');
 const [sending,setSending]=useState(false);
 const [success,setSuccess]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  fetch('/api/reviews',{cache:'no-store'}).then(r=>r.json()).then(data=>{
   if(active){setEnabled(data.ok===true&&data.enabled===true);setReviews(Array.isArray(data.reviews)?data.reviews:[]);}
  }).catch(()=>{}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false};
 },[]);
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(!enabled||sending||!consent)return;
  setSending(true);setError('');
  try{
   const response=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,comment,source,rating:rating||null,consent,website})});
   const data=await response.json();
   if(!response.ok||data.ok!==true)throw Error(String(data.code??'error'));
   setSuccess(true);setName('');setComment('');setRating(0);setConsent(false);
  }catch(e){
   const code=e instanceof Error?e.message:'';
   setError(code==='rate_limit'?(fr?'Une contribution a déjà été envoyée récemment. Réessayez plus tard.':'A review was submitted recently. Please try later.'):
    fr?'Impossible d’envoyer votre avis. Vérifiez les champs ou réessayez plus tard.':'Could not submit your review. Check the fields or try again later.');
  }finally{setSending(false)}
 };
 return <section id="avis" className="visitor-reviews" aria-labelledby="visitor-reviews-title">
  <div className="visitor-reviews-shell">
   <div className="visitor-reviews-heading">
    <span>{fr?'10 / PAROLES DE VISITEURS':'10 / VISITOR STORIES'}</span>
    <h2 id="visitor-reviews-title">{fr?<>Votre aventure, <em>vos mots.</em></>:<>Your adventure, <em>your words.</em></>}</h2>
    <p>{fr?'Vous avez visité Aquamazone ? Racontez votre expérience et dites-nous comment vous nous avez découverts.':'Visited Aquamazone? Share your experience and tell us how you found us.'}</p>
   </div>
   <div className="visitor-reviews-grid">
    <div className="visitor-reviews-public">
     <div className="visitor-reviews-subheading"><h3>{fr?'Les avis de nos visiteurs':'Visitor reviews'}</h3><span>{fr?'Avis approuvés':'Approved reviews'}</span></div>
     {loading?<p className="visitor-reviews-empty">{fr?'Chargement des avis…':'Loading reviews…'}</p>:
       reviews.length===0?<div className="visitor-reviews-empty"><p>{fr?'Les premiers témoignages seront publiés ici après modération.':'The first visitor stories will appear here after moderation.'}</p></div>:
       <div className="visitor-reviews-list">{reviews.map(r=><article className="visitor-review" key={r.id}>
        <div className="visitor-review-head"><strong>{r.name}</strong><time dateTime={r.createdAt}>{new Intl.DateTimeFormat(fr?'fr-FR':'en-GB',{month:'short',year:'numeric'}).format(new Date(r.createdAt))}</time></div>
        {r.rating!==null&&<div className="visitor-review-stars" aria-label={fr?r.rating+' étoiles sur 5':r.rating+' out of 5 stars'}>{Array.from({length:5},(_,i)=><Star key={i} size={14} fill={i<(r.rating??0)!?'currentColor':'none'} aria-hidden="true"/>)}</div>}
        <p>{r.comment}</p>
        <span>{fr?'Découverte : ':'Discovered via: '}{sourceNames[r.source]?.[lang]??sourceNames.other[lang]}</span>
       </article>)}</div>}
    </div>
    <div className="visitor-reviews-form-area">
     <h3>{fr?'Partagez votre expérience':'Share your experience'}</h3>
     <p>{fr?'Votre avis est lu par notre équipe avant publication. Aucun numéro ni compte requis.':'Our team reviews submissions before publishing. No account or phone number required.'}</p>
     {!loading&&!enabled?<div className="visitor-reviews-disabled" role="status">{fr?'Le formulaire d’avis sera bientôt disponible.':'The review form will be available soon.'}</div>:
      success?<div className="visitor-reviews-success" role="status"><Check size={24}/><strong>{fr?'Merci pour votre retour !':'Thank you for your feedback!'}</strong><p>{fr?'Votre commentaire a été reçu et sera examiné avant sa publication.':'Your review was received and will be checked before publication.'}</p><button type="button" onClick={()=>setSuccess(false)}>{fr?'Écrire un autre avis':'Write another review'}</button></div>:
      <form onSubmit={submit} className="visitor-reviews-form">
       <label>{fr?'Votre prénom ou nom affiché':'Your display name'}<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={60} required autoComplete="name" placeholder={fr?'Ex. : Aïcha':'E.g. Aïcha'}/></label>
       <label>{fr?'Comment avez-vous connu Aquamazone ?':'How did you find Aquamazone?'}<select value={source} onChange={e=>setSource(e.target.value as DiscoverySource)}>{sources.map(s=><option key={s} value={s}>{sourceNames[s][lang]}</option>)}</select></label>
       <fieldset className="visitor-reviews-rating"><legend>{fr?'Votre note (facultatif)':'Your rating (optional)'}</legend><div>{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={fr?n+' étoile(s)':n+' star(s)'} aria-pressed={rating===n} onClick={()=>setRating(rating===n?0:n)}><Star size={23} fill={n<=rating?'currentColor':'none'} aria-hidden="true"/></button>)}</div></fieldset>
       <label>{fr?'Votre commentaire':'Your review'}<textarea value={comment} onChange={e=>setComment(e.target.value)} minLength={20} maxLength={1000} rows={5} required placeholder={fr?'Racontez votre visite : activités, accueil, ambiance…':'Tell us about your visit: activities, welcome, atmosphere…'}/><small>{comment.length} / 1000</small></label>
       <div className="visitor-reviews-honeypot" aria-hidden="true"><label>Website<input value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label></div>
       <label className="visitor-reviews-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>{fr?'J’accepte la publication de mon nom affiché et de mon commentaire, après validation par l’équipe.':'I agree to publication of my display name and review after team approval.'}</span></label>
       {error&&<p className="visitor-reviews-error" role="alert">{error}</p>}
       <button className="visitor-reviews-submit" disabled={sending||!enabled||!consent} type="submit">{sending?(fr?'Envoi en cours…':'Submitting…'):(fr?'Envoyer mon avis':'Submit my review')}<ArrowRight size={18}/></button>
      </form>}
    </div>
   </div>
  </div>
 </section>;
}
