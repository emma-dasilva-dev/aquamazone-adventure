'use client';

import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowUpRight,ArrowRight,Clock,MapPin,Play} from 'lucide-react';

type Lang='fr'|'en';

const activities=[
 {id:'pedalo-simple',fr:'Pédalo simple',en:'Single pedalo',duration:'30 min',price:'3 000 FCFA / personne',note:'1 personne par pédalo',noteEn:'1 person per craft',image:'/images/activities/pedalo-simple.webp'},
 {id:'pedalo-double',fr:'Pédalo double',en:'Double pedalo',duration:'30 min',price:'3 000 FCFA / personne',note:'2 personnes sur le même pédalo',noteEn:'2 people on the same craft',image:'/images/activities/pedalo-double.webp'},
 {id:'canoe-simple',fr:'Canoë-kayak simple',en:'Single canoe-kayak',duration:'30 min',price:'3 000 FCFA / personne',note:'1 personne par embarcation',noteEn:'1 person per craft',image:'/images/activities/canoe-simple.webp'},
 {id:'canoe-double',fr:'Canoë-kayak double',en:'Double canoe-kayak',duration:'30 min',price:'3 000 FCFA / personne',note:'2 personnes dans la même embarcation',noteEn:'2 people in the same craft',image:'/images/activities/canoe-double.webp'},
 {id:'paddle',fr:'Paddle / Stand Up',en:'Stand-up paddle',duration:'30 min',price:'3 000 FCFA',note:'',image:'/images/activities/paddle.webp'},
 {id:'boat',fr:'Bateau à pédales',en:'Pedal-powered boat',duration:'30 min',price:'5 000 FCFA / personne pour 2',note:'À partir de 3 personnes : 3 000 FCFA / personne',noteEn:'From 3 people: 3,000 FCFA per person',image:'/images/activities/bateau-a-pedales.webp'},
 {id:'ball',fr:'Bulle gonflable / Water Ball',en:'Inflatable water ball',duration:'20 min',price:'3 000 FCFA / personne',note:'',image:'/images/activities/structure-gonflable.webp'},
 {id:'tour',fr:'Balade sur le lac',en:'Lake tour',duration:'30 min',price:'5 000 FCFA / personne',note:'',image:'/images/activities/mangrove-paysage.webp'},
 {id:'mangrove',fr:'Visite de la mangrove',en:'Mangrove visit',duration:'1 h',price:'10 000 FCFA / personne',note:'Découverte de la mangrove',noteEn:'Mangrove discovery',image:'/images/activities/mangrove-paysage.webp'},
 {id:'jetski',fr:'Jet-ski',en:'Jet ski',duration:'',price:'',note:'Indisponible — maintenance',noteEn:'Unavailable — maintenance',image:'/images/activities/jet-ski.webp'}
];

export default function ActivitiesPage(){
 const [lang,setLang]=useState<Lang>('fr');
 const fr=lang==='fr';
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);

 return <main className="activities-page">
  <header className="activities-page-header">
   <a href="/" className="activities-back"><ArrowLeft size={17}/>{fr?'Retour à l’accueil':'Back home'}</a>
   <a href="/" className="activities-wordmark">AQUAMAZONE <span>ADVENTURE / BENIN</span></a>
   <div className="activities-page-actions">
    <button type="button" className="activities-lang" onClick={()=>setLang(fr?'en':'fr')}><strong>{lang.toUpperCase()}</strong><span>/</span><span>{fr?'EN':'FR'}</span></button>
    <a href="/#reservation" className="activities-book">{fr?'Réserver':'Book'} <ArrowUpRight size={16}/></a>
   </div>
  </header>

  <section className="activities-page-hero">
   <div>
    <p className="activities-page-kicker">02 / {fr?'NOS ACTIVITÉS':'OUR ACTIVITIES'}</p>
    <h1>{fr?<>Toutes les expériences <em>sur l’eau.</em></>:<>Every experience <em>on the water.</em></>}</h1>
    <p>{fr?'Découvrez nos activités, leurs tarifs et les formats disponibles. Choisissez votre expérience puis demandez votre réservation.':'Explore our activities, prices and formats. Choose your experience and request a booking.'}</p>
   </div>
   <div className="activities-page-meta"><span><MapPin size={16}/> Adounko · Cotonou</span><span><Clock size={16}/> {fr?'Sam. · Dim. · Jours fériés · 11h–18h':'Sat. · Sun. · Public holidays · 11am–6pm'}</span></div>
  </section>

  <section className="activities-page-list" aria-label={fr?'Toutes les activités':'All activities'}>
   {activities.map((a,i)=><article className="activity-detail-card" key={a.id}>
    <div className="activity-detail-image"><img src={a.image} alt={fr?a.fr:a.en} loading={i<3?'eager':'lazy'}/><span>{String(i+1).padStart(2,'0')}</span></div>
    <div className="activity-detail-body">
      <p className="activity-detail-kicker">{fr?'EXPÉRIENCE':'EXPERIENCE'} · {String(i+1).padStart(2,'0')}</p>
      <h2>{fr?a.fr:a.en}</h2>
      <div className="activity-detail-facts"><span>{a.duration}</span><strong>{a.price}</strong></div>
      {a.note&&<p className={a.id==='jetski'?'activity-detail-unavailable':'activity-detail-note'}>{fr?a.note:(a.noteEn??a.note)}</p>}
      {a.id!=='jetski'&&<a href="/#reservation" className="activity-detail-cta">{fr?'Demander une réservation':'Request a booking'} <ArrowUpRight size={17}/></a>}
    </div>
   </article>)}
  </section>

  <section className="activities-video-section">
   <div className="activities-video-copy">
    <p className="activities-page-kicker">EXEMPLES · VIDÉOS</p>
    <h2>{fr?<>Voir l’expérience <em>en mouvement.</em></>:<>See the experience <em>in motion.</em></>}</h2>
    <p>{fr?'Retrouvez les présentations et vidéos d’Aquamazone sur notre chaîne officielle. Nous y montrons les activités et les moments vécus sur place.':'Watch Aquamazone presentations and videos on our official channel, featuring activities and moments from the venue.'}</p>
    <a href="https://www.youtube.com/@AquAmazone229" target="_blank" rel="noopener noreferrer" className="activities-video-cta"><Play size={16} fill="currentColor"/> {fr?'Voir les vidéos Aquamazone':'Watch Aquamazone videos'} <ArrowUpRight size={16}/></a>
   </div>
   <div className="activities-video-grid">
    <div className="activities-video-card">
     <div className="activities-video-card-image"><video controls playsInline preload="metadata" poster="/images/activities/canoe-simple.webp"><source src="/videos/canoe-simple.mp4" type="video/mp4"/></video></div>
     <div><span>{fr?'EXEMPLE · CANOË-KAYAK':'EXAMPLE · CANOE-KAYAK'}</span><strong>{fr?'Voir l’activité en action':'See the activity in action'}</strong><ArrowUpRight size={20}/></div>
    </div>
    <a href="https://www.youtube.com/@AquAmazone229" target="_blank" rel="noopener noreferrer" className="activities-video-card" aria-label={fr?'Ouvrir les vidéos Aquamazone':'Open Aquamazone videos'}>
     <div className="activities-video-card-image"><img src="/images/gallery/gallery-18.webp" alt="" loading="lazy"/></div>
     <div><span>YOUTUBE · AQUAMAZONE</span><strong>{fr?'Plus de vidéos et présentations':'More videos and presentations'}</strong><ArrowUpRight size={20}/></div>
    </a>
   </div>
  </section>

  <section className="activities-page-footer-cta">
   <p>{fr?'Une activité vous intéresse ?':'Found your activity?'}</p>
   <h2>{fr?<>Préparez votre sortie <em>au bord de l’eau.</em></>:<>Plan your day <em>by the water.</em></>}</h2>
   <a href="/#reservation">{fr?'Demander une réservation':'Request a booking'} <ArrowRight size={18}/></a>
  </section>
 </main>;
}
