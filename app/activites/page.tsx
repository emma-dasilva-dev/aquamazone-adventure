'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Clock,MapPin,Play} from 'lucide-react';
type Lang='fr'|'en'|'es'|'hi'|'fon';
const items=[
 {id:'pedalo-simple',fr:'Pédalo simple',en:'Single pedalo',duration:'30 min',price:'3 000 FCFA / personne',note:'1 personne par pédalo',noteEn:'1 person per craft',image:'/images/activities/pedalo-simple.webp'},
 {id:'pedalo-double',fr:'Pédalo double',en:'Double pedalo',duration:'30 min',price:'3 000 FCFA / personne',note:'2 personnes sur le même pédalo',noteEn:'2 people on the same craft',image:'/images/activities/pedalo-double.webp'},
 {id:'canoe-simple',fr:'Canoë-kayak simple',en:'Single canoe-kayak',duration:'30 min',price:'3 000 FCFA / personne',note:'1 personne par embarcation',noteEn:'1 person per craft',image:'/images/activities/canoe-simple.webp'},
 {id:'canoe-double',fr:'Canoë-kayak double',en:'Double canoe-kayak',duration:'30 min',price:'3 000 FCFA / personne',note:'2 personnes dans la même embarcation',noteEn:'2 people in the same craft',image:'/images/activities/canoe-double.webp'},
 {id:'paddle',fr:'Paddle / Stand Up',en:'Stand-up paddle',duration:'30 min',price:'3 000 FCFA',note:'',image:'/images/activities/paddle.webp'},
 {id:'boat',fr:'Bateau à pédales',en:'Pedal-powered boat',duration:'30 min',price:'10 000 FCFA / 2 personnes',note:'3 à 4 personnes : 3 000 FCFA / personne',noteEn:'3 to 4 people: 3,000 FCFA per person',image:'/images/activities/bateau-a-pedales.webp'},
 {id:'ball',fr:'Bulle gonflable / Water Ball',en:'Inflatable water ball',duration:'20 min',price:'3 000 FCFA / personne',note:'',image:'/images/activities/structure-gonflable.webp'},
 {id:'tour',fr:'Balade sur le lac / Visite des mangroves',en:'Lake tour / Mangrove visit',duration:'30–45 min',price:'5 000 FCFA / adulte',note:'Enfant de moins de 12 ans : 2 500 FCFA',noteEn:'Child under 12: 2,500 FCFA',image:'/images/activities/mangrove-paysage.webp'},
 {id:'jetski',fr:'Jet-ski',en:'Jet ski',duration:'',price:'',note:'Indisponible — maintenance',noteEn:'Unavailable — maintenance',image:'/images/activities/jet-ski.webp',unavailable:true},
 {id:'rental',fr:'Location embarcation + moteur + machiniste',en:'Boat, motor and operator hire',duration:'Demi-journée / journée',price:'Sur devis',note:'Réservation obligatoire',noteEn:'Advance booking required',image:'/images/gallery/gallery-14.webp'}
];
export default function ActivitiesPage(){
 const [lang,setLang]=useState<Lang>('fr');
 const fr=lang==='fr';
 useEffect(()=>{try{const saved=localStorage.getItem('aquamazone-language');if(saved&&['fr','en','es','hi','fon'].includes(saved))setLang(saved as Lang)}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem('aquamazone-language',lang)}catch{}},[lang]);
 useEffect(()=>{document.documentElement.lang=lang;return()=>{document.documentElement.lang='fr'}},[lang]);
 return <main className="az-catalog">
  <header className="az-catalog-header">
   <a href="/" className="az-catalog-back"><ArrowLeft size={16}/>{fr?'Accueil':'Home'}</a>
   <a href="/" className="az-catalog-logo">AQUAMAZONE <small>ADVENTURE</small></a>
   <div className="az-catalog-header-actions"><button type="button" onClick={()=>setLang(fr?'en':'fr')} aria-label={fr?'Switch to English':'Passer en français'}>{lang.toUpperCase()} / {fr?'EN':'FR'}</button><a href="/#reservation">{fr?'Réserver':'Book'} <ArrowUpRight size={16}/></a></div>
  </header>
  <section className="az-catalog-hero">
   <p className="az-catalog-kicker">02 / {fr?'NOS ACTIVITÉS':'OUR ACTIVITIES'}</p>
   <h1>{fr?<>Toutes les expériences <em>sur l’eau.</em></>:<>All experiences <em>on the water.</em></>}</h1>
   <div className="az-catalog-intro"><p>{fr?'Découvrez les activités proposées à Aquamazone Adventure, leurs tarifs et leurs formats.':'Explore Aquamazone Adventure activities, prices and formats.'}</p><span><MapPin size={15}/> Adounko · Bénin <Clock size={15}/> {fr?'11h–18h':lang==='es'?'De 11 a. m. a 6 p. m.':lang==='hi'?'सुबह 11 बजे से शाम 6 बजे तक':'11am to 6pm'}</span></div>
  </section>
  <section className="az-catalog-list" aria-label={fr?'Catalogue des activités':'Activities catalogue'}>
   {items.map((item,i)=><article className="az-catalog-item" key={item.id}>
    <div className="az-catalog-image"><img src={item.image} alt={fr?item.fr:item.en} loading="lazy"/><span>{String(i+1).padStart(2,'0')}</span></div>
    <div className="az-catalog-detail">
     <p className="az-catalog-kicker">{fr?'ACTIVITÉ':'ACTIVITY'} / {String(i+1).padStart(2,'0')}</p>
     <h2>{fr?item.fr:item.en}</h2>
     <div className="az-catalog-facts"><span>{item.duration}</span><strong>{item.price}</strong></div>
     {item.note&&<p className={item.unavailable?'az-catalog-unavailable':''}>{fr?item.note:(item.noteEn??item.note)}</p>}
     {!item.unavailable&&<a href={item.id==='rental'?'https://wa.me/2290154284444':'/#reservation'}>{fr?'Demander une réservation':'Request a booking'} <ArrowUpRight size={16}/></a>}
    </div>
   </article>)}
  </section>
  <section className="az-catalog-video">
   <div><p className="az-catalog-kicker">{fr?'À VOIR EN VIDÉO':'WATCH IN VIDEO'}</p><h2>{fr?<>Les expériences <em>en mouvement.</em></>:<>Experiences <em>in motion.</em></>}</h2><p>{fr?'Découvrez les vidéos publiées par Aquamazone Adventure. Les vidéos spécifiques à chaque activité seront ajoutées dès qu’elles seront disponibles.':'Explore videos published by Aquamazone Adventure. Activity-specific clips will be added as they become available.'}</p><a href="https://www.youtube.com/results?search_query=Aquamazone+Adventure+Benin" target="_blank" rel="noopener noreferrer"><Play size={16}/> {fr?'Rechercher les vidéos Aquamazone':'Find Aquamazone videos'} <ArrowUpRight size={16}/></a></div>
   <div className="az-catalog-video-image"><img src="/images/gallery/gallery-18.webp" alt={fr?'Canoës sur le lac':'Canoes on the lake'} loading="lazy"/></div>
  </section>
  <footer className="az-catalog-footer"><span>{fr?'Votre prochaine aventure commence ici.':'Your next adventure starts here.'}</span><a href="/#reservation">{fr?'Préparer ma visite':'Plan my visit'} <ArrowUpRight size={17}/></a></footer>
 </main>;
}
