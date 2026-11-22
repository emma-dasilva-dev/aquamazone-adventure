'use client';
import {useEffect,useState} from 'react';
import ImmersiveGallery from './ImmersiveGallery';
import AquamazoneAssistant from './AquamazoneAssistant';
import ReservationPlanner from './ReservationPlanner';
import LocationRouteVideo from './LocationRouteVideo';
import VisitorReviews from './VisitorReviews';
import {ArrowDown,ArrowUpRight,ArrowRight,Menu,X,Plus,Minus,MapPin,Clock,UtensilsCrossed,MessageCircle,Waves,ZoomIn,Instagram,Youtube,Globe2,ChevronDown} from 'lucide-react';

type Lang='fr'|'en'|'hi'|'es'|'fon';
const languageOptions: {code:Lang;label:string}[]=[{code:'fr',label:'Français'},{code:'en',label:'English'},{code:'hi',label:'हिन्दी'},{code:'es',label:'Español'},{code:'fon',label:'Fɔ̀ngbè'}];
function TikTokIcon({size=17}:{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
   <path d="M16.65 2h-3.1v13.35c0 1.98-1.6 3.58-3.58 3.58a3.58 3.58 0 1 1 2.52-6.11V9.36a6.72 6.72 0 1 0 4.16 6.21V8.53a8.23 8.23 0 0 0 5.14 1.62V7.01A5.17 5.17 0 0 1 16.65 2Z"/>
 </svg>;
}

const activities=[
 {id:'pedalo-simple',fr:'Pédalo simple',en:'Single pedalo',duration:'30 min',price:'3 000 FCFA / personne',note:'1 personne par pédalo',noteEn:'1 person per craft'},
 {id:'pedalo-double',fr:'Pédalo double',en:'Double pedalo',duration:'30 min',price:'3 000 FCFA / personne',note:'2 personnes sur le même pédalo',noteEn:'2 people on the same craft'},
 {id:'canoe-simple',fr:'Canoë-kayak simple',en:'Single canoe-kayak',duration:'30 min',price:'3 000 FCFA / personne',note:'1 personne par embarcation',noteEn:'1 person per craft'},
 {id:'canoe-double',fr:'Canoë-kayak double',en:'Double canoe-kayak',duration:'30 min',price:'3 000 FCFA / personne',note:'2 personnes dans la même embarcation',noteEn:'2 people in the same craft'},
 {id:'paddle',fr:'Paddle / Stand Up',en:'Stand-up paddle',duration:'30 min',price:'3 000 FCFA',note:''},
 {id:'boat',fr:'Bateau à pédales',en:'Pedal-powered boat',duration:'30 min',price:'10 000 FCFA / 2 personnes',note:'3 à 4 personnes : 3 000 FCFA / personne',noteEn:'3 to 4 people: 3,000 FCFA per person'},
 {id:'ball',fr:'Bulle gonflable / Water Ball',en:'Inflatable water ball',duration:'20 min',price:'3 000 FCFA / personne',note:''},
 {id:'tour',fr:'Balade sur le lac / Visite des mangroves',en:'Lake tour / Mangrove visit',duration:'30–45 min',price:'5 000 FCFA / adulte',note:'Enfant de moins de 12 ans : 2 500 FCFA',noteEn:'Child under 12: 2,500 FCFA'},
 {id:'jetski',fr:'Jet-ski',en:'Jet ski',duration:'',price:'',note:'Indisponible — maintenance',noteEn:'Unavailable — maintenance',unavailable:true},
 {id:'rental',fr:'Location embarcation + moteur + machiniste',en:'Boat, motor and operator hire',duration:'Demi-journée / journée',price:'Sur devis',note:'Réservation obligatoire',noteEn:'Advance booking required'}
];
const copy={fr:{nav:['Activités','Forfaits','Restaurant','Galerie','Localisation'],book:'Réserver',hero:'La détente au fil de l’eau.',explore:'Explorer les activités',eyebrow:'VOTRE PROCHAINE ÉVASION',intro:'L’aventure commence ici.',desc:'Des expériences nautiques, des moments à partager et un cadre naturel à découvrir.',activity:'Choisissez votre aventure',activitySub:'Découvrez les activités, leurs tarifs et les photos prises à Aquamazone.',featured:'À DÉCOUVRIR',packages:'Nos forfaits expériences',food:'Une pause gourmande au bord de l’eau',gallery:'Des souvenirs à vivre',location:'Comment nous trouver',hours:'Samedi, dimanche et jours fériés · 11h00–18h00',cta:'Préparer ma visite',placeholder:'Photographie Aquamazone à intégrer',ask:'Une question ?',chat:'Assistant Aquamazone',chatWelcome:'Bonjour ! Je peux vous renseigner sur nos horaires, tarifs et notre localisation.',chatQuestions:['Quels sont vos horaires ?','Où êtes-vous situés ?','Combien coûte le pédalo ?'],close:'Fermer',menu:'Ouvrir le menu'},en:{nav:['Activities','Packages','Restaurant','Gallery','Location'],book:'Book',hero:'Relaxation by the water.',explore:'Explore activities',eyebrow:'YOUR NEXT ESCAPE',intro:'Adventure starts here.',desc:'Water activities, moments together and a natural setting to discover.',activity:'Choose your adventure',activitySub:'Explore activities, prices and photographs from Aquamazone.',featured:'EXPLORE',packages:'Experience packages',food:'A delicious break by the water',gallery:'Memories in the making',location:'Find us',hours:'Saturday, Sunday and public holidays · 11am–6pm',cta:'Plan my visit',placeholder:'Aqu​amazone photo to be added',ask:'Need help?',chat:'Aquamazone Assistant',chatWelcome:'Hello! I can help with our opening hours, prices and location.',chatQuestions:['What are your opening hours?','Where are you located?','How much is pedal boating?'],close:'Close',menu:'Open menu'}};
const extraCopy={
 es:{nav:['Actividades','Paquetes','Restaurante','Galería','Ubicación'],book:'Reservar',hero:'Relájate junto al agua.',explore:'Explorar actividades',eyebrow:'TU PRÓXIMA ESCAPADA',intro:'La aventura comienza aquí.',desc:'Actividades acuáticas, momentos para compartir y naturaleza por descubrir.',activity:'Elige tu aventura',activitySub:'Descubre las actividades, precios y fotos de Aquamazone.',featured:'DESCUBRIR',packages:'Nuestros paquetes',food:'Una pausa deliciosa junto al agua',gallery:'Recuerdos por vivir',location:'Cómo llegar',hours:'Sábados, domingos y festivos · 11:00–18:00',cta:'Planificar mi visita',placeholder:'Foto de Aquamazone',ask:'¿Una pregunta?',chat:'Asistente Aquamazone',chatWelcome:'¡Hola! Puedo ayudarte con horarios, precios y ubicación.',chatQuestions:['¿Cuál es el horario?','¿Dónde están?','¿Cuánto cuesta el pedaló?'],close:'Cerrar',menu:'Abrir menú'},
 hi:{nav:['गतिविधियाँ','पैकेज','रेस्तराँ','गैलरी','स्थान'],book:'बुक करें',hero:'पानी के किनारे सुकून।',explore:'गतिविधियाँ देखें',eyebrow:'आपकी अगली सैर',intro:'रोमांच यहाँ शुरू होता है।',desc:'पानी की गतिविधियाँ, साथ बिताए पल और प्रकृति का आनंद।',activity:'अपनी गतिविधि चुनें',activitySub:'Aquamazone की गतिविधियाँ, कीमतें और तस्वीरें देखें।',featured:'देखें',packages:'हमारे पैकेज',food:'पानी के किनारे स्वादिष्ट भोजन',gallery:'यादगार पल',location:'हम तक कैसे पहुँचें',hours:'शनिवार, रविवार और सार्वजनिक अवकाश · 11:00–18:00',cta:'यात्रा की योजना बनाएँ',placeholder:'Aquamazone की तस्वीर',ask:'कोई सवाल?',chat:'Aquamazone सहायक',chatWelcome:'नमस्ते! समय, कीमत और स्थान की जानकारी उपलब्ध है।',chatQuestions:['खुलने का समय?','आप कहाँ हैं?','पेडलो की कीमत?'],close:'बंद करें',menu:'मेनू खोलें'},
 fon:{nav:['Activités','Forfaits','Restaurant','Fɔtó','Localisation'],book:'Réserver',hero:'La détente au fil de l’eau.',explore:'NǓ WÁN WÁN',eyebrow:'AQUAMAZONE ADVENTURE',intro:'L’aventure commence ici.',desc:'Activités nautiques, détente et découvertes naturelles à Adounko.',activity:'Choisissez votre aventure',activitySub:'Activités, tarifs et photos à Aquamazone.',featured:'À DÉCOUVRIR',packages:'Nos forfaits',food:'Restaurant & Bar',gallery:'Galerie',location:'Comment nous trouver',hours:'Samedi, dimanche et jours fériés · 11h–18h',cta:'Préparer ma visite',placeholder:'Photo Aquamazone',ask:'Une question ?',chat:'Assistant Aquamazone',chatWelcome:'Bonjour ! Notre équipe peut vous aider.',chatQuestions:['Horaires ?','Localisation ?','Tarifs ?'],close:'Fermer',menu:'Ouvrir le menu'}
} satisfies Record<Exclude<Lang,'fr'|'en'>,typeof copy.fr>;
const allCopy:Record<Lang,typeof copy.fr>={...copy,...extraCopy};
const sections=['activities','packages','restaurant','gallery','location'];

const faqItems=[
 {q:{fr:'Quels sont vos jours et horaires d’ouverture ?',en:'When are you open?'},a:{fr:'Nous sommes ouverts les samedis, dimanches et jours fériés, de 11h à 18h.',en:'We are open on Saturdays, Sundays and public holidays, from 11am to 6pm.'}},
 {q:{fr:'Peut-on venir en semaine ?',en:'Can we visit during the week?'},a:{fr:'Oui, les visites en semaine sont possibles pour les groupes de 6 personnes minimum, sur réservation préalable, avec une formule de 4 activités par personne. Contactez-nous sur WhatsApp pour organiser votre sortie.',en:'Yes. Weekday visits are available for groups of at least 6 people by advance reservation, with a package of 4 activities per person. Contact us on WhatsApp to arrange your visit.'}},
 {q:{fr:'Où se trouve AQUAMAZONE ADVENTURE ?',en:'Where is AQUAMAZONE ADVENTURE located?'},a:{fr:'Au Village Adounko, sur la Route des Pêches à Cotonou, au Bénin. Depuis le Carrefour Club des Rois, continuez vers le grand Carrefour Togbin Plage, passez la station JBP puis suivez les panneaux AQUAMAZONE vers le lac et l’embarcadère.',en:'In Adounko Village on the Route des Pêches in Cotonou, Benin. From Carrefour Club des Rois, continue towards the large Togbin Plage junction, pass the JBP station, then follow the AQUAMAZONE signs towards the lake and landing.'}},
 {q:{fr:'La traversée en pirogue est-elle payante ?',en:'Is the return boat crossing charged separately?'},a:{fr:'La traversée en pirogue aller-retour est obligatoire pour accéder à la base. Tarif : 1 500 FCFA par adulte et par personne dès 12 ans ; 500 FCFA par enfant de moins de 12 ans. Elle est déjà incluse dans les forfaits, sans double facturation.',en:'The return pirogue crossing is mandatory to reach the base. The price is 1,500 FCFA for adults and ages 12+, and 500 FCFA for children under 12. Packages already include it, so you are not charged twice.'}},
 {q:{fr:'Quelles activités peut-on faire sur place ?',en:'What activities are available?'},a:{fr:'Nous proposons notamment le pédalo, le canoë-kayak, le paddle, le bateau à pédales, la bulle gonflable, ainsi que la balade sur le lac / visite des mangroves. Le jet-ski est actuellement indisponible pour maintenance.',en:'Our experiences include pedal boats, canoeing and kayaking, stand-up paddle, pedal-powered boats, inflatable water balls, a lake tour / mangrove visit. Jet skiing is currently unavailable due to maintenance.'}},
 {q:{fr:'Comment choisir un forfait sans confusion ?',en:'How do I know exactly what a package includes?'},a:{fr:'Chaque forfait indique le nombre de participants, son tarif et les activités incluses. Pour le forfait découverte GLÈLÈ, choisissez une seule activité : canoë-kayak simple OU pédalo simple OU paddle/stand-up (30 min). La traversée est incluse. Pour toute précision sur un autre forfait, contactez notre équipe.',en:'Each package states the number of guests, the price and the included activities. The GLÈLÈ discovery package includes ONE 30-minute activity: a single canoe-kayak OR a single pedalo OR stand-up paddle. The crossing is included. Contact our team to confirm details of other packages.'}},
 {q:{fr:'Peut-on manger au restaurant ?',en:'Is food available at the restaurant?'},a:{fr:'Oui, notre Restaurant & Bar propose notamment des poissons braisés, des brochettes de poulet, des accompagnements et des boissons fraîches. Nous vous recommandons de confirmer votre commande avant votre arrivée.',en:'Yes. Our Restaurant & Bar offers grilled fish, chicken skewers, sides and cold drinks. We recommend confirming your order before you arrive.'}},
 {q:{fr:'Comment réserver ou poser une question ?',en:'How can I book or ask a question?'},a:{fr:'Les demandes pour le week-end ouvrent chaque lundi. Pour une visite samedi, envoyez votre demande au plus tard vendredi à 23h59 ; pour dimanche, au plus tard samedi à 23h59 (heure du Bénin). Le dimanche, les nouvelles demandes en ligne sont closes. Toute visite en semaine doit être organisée à l’avance avec notre équipe sur WhatsApp au +229 01 54 28 44 44. Le paiement en ligne et la confirmation automatique ne sont pas encore actifs.',en:'Weekend enquiries open every Monday. For Saturday visits, request by Friday 11:59pm; for Sunday visits, by Saturday 11:59pm (Benin time). New online enquiries are closed on Sunday. Weekday visits must be arranged in advance with our team on WhatsApp at +229 01 54 28 44 44. Online payment and automatic confirmation are not active yet.'}}
] as const;

const bookingWhatsApp='https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20activit%C3%A9%20%C3%A0%20Aquamazone.';
// Official Aquamazone imagery; Water Ball uses the supplied inflatable-equipment photo, and rental uses a boat-trip scene.
const activityVisuals:Record<string,string>={
 'pedalo-simple':'/images/activities/pedalo-simple.webp',
 'pedalo-double':'/images/activities/pedalo-double.webp',
 'canoe-simple':'/images/activities/canoe-simple.webp',
 'canoe-double':'/images/activities/canoe-double.webp',
 paddle:'/images/activities/paddle.webp',
 boat:'/images/activities/bateau-a-pedales.webp',
 ball:'/images/activities/structure-gonflable.webp',
 tour:'/images/activities/mangrove-paysage.webp',
 jetski:'/images/activities/jet-ski.webp',
 rental:'/images/gallery/gallery-14.webp'
};
function CraftThumbnail({kind,lang}:{kind:'pedalo-simple'|'pedalo-double'|'canoe-simple'|'canoe-double';lang:Lang}){
 const tandem=kind.endsWith('-double');
 const pedalo=kind.startsWith('pedalo');
 const people=tandem?2:1;
 return <div className="az-craft-visual" aria-label={(lang!=='en'?'Schéma illustratif : ':'Illustrative diagram: ')+(pedalo?'pédalo':'canoë-kayak')+' · '+people+(lang!=='en'?' personne(s)':' person(s)')}>
  <svg viewBox="0 0 200 112" role="img" aria-hidden="true" focusable="false">
   <path d="M13 92 Q35 85 57 92 T101 92 T145 92 T188 92" fill="none" stroke="#55B5EF" strokeWidth="3" strokeLinecap="round"/>
   {pedalo?<g>
     <path d="M20 78 H180 L169 93 H31 Z" fill="#0055A4"/>
     <path d="M28 78 H172" stroke="#062047" strokeWidth="3"/>
     {tandem?<><g transform="translate(57 0)"><circle cx="0" cy="74" r="13" fill="none" stroke="#062B60" strokeWidth="3"/><path d="M0 74L13 53L28 74H0L13 53L19 43" fill="none" stroke="#FFD326" strokeWidth="3"/><circle cx="14" cy="32" r="7" fill="#062047"/><path d="M14 39L19 49L10 57" stroke="#062047" strokeWidth="5" strokeLinecap="round"/></g><g transform="translate(112 0)"><circle cx="0" cy="74" r="13" fill="none" stroke="#062B60" strokeWidth="3"/><path d="M0 74L13 53L28 74H0L13 53L19 43" fill="none" stroke="#FFD326" strokeWidth="3"/><circle cx="14" cy="32" r="7" fill="#062047"/><path d="M14 39L19 49L10 57" stroke="#062047" strokeWidth="5" strokeLinecap="round"/></g></>:<g transform="translate(80 0)"><circle cx="0" cy="74" r="13" fill="none" stroke="#062B60" strokeWidth="3"/><path d="M0 74L13 53L28 74H0L13 53L19 43" fill="none" stroke="#FFD326" strokeWidth="3"/><circle cx="14" cy="32" r="7" fill="#062047"/><path d="M14 39L19 49L10 57" stroke="#062047" strokeWidth="5" strokeLinecap="round"/></g>}
    </g>:<g>
     <path d="M15 73 Q100 52 185 73 Q169 95 100 94 Q31 95 15 73Z" fill="#0055A4"/>
     <path d="M15 73 Q100 52 185 73" fill="none" stroke="#062047" strokeWidth="3"/>
     {(tandem?[66,132]:[100]).map(x=><g key={x}><circle cx={x} cy="45" r="9" fill="#062047"/><path d={`M${x} 56l-6 14m6-13l12 12`} fill="none" stroke="#FFD326" strokeWidth="5" strokeLinecap="round"/><path d={`M${x-17} 33l33 48`} stroke="#062047" strokeWidth="3" strokeLinecap="round"/></g>)}
    </g>}
  </svg>
  <span>{lang!=='en'?(tandem?'2 PLACES':'1 PLACE'):(tandem?'2 SEATS':'1 SEAT')}</span>
 </div>;
}
export default function Home(){
 const [lang,setLang]=useState<Lang>('fr');const [languageOpen,setLanguageOpen]=useState(false);const [menu,setMenu]=useState(false);const [preview,setPreview]=useState<string|null>(null);const [reservationIntent,setReservationIntent]=useState<{activity:string;version:number}|null>(null);const t=allCopy[lang];const contentLang=lang==='en'?'en':'fr';
 useEffect(()=>{try{const saved=localStorage.getItem('aquamazone-language');if(saved&&languageOptions.some(l=>l.code===saved))setLang(saved as Lang)}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=lang==='fon'?'fon':lang;try{localStorage.setItem('aquamazone-language',lang)}catch{}},[lang]);
 useEffect(()=>{document.body.style.overflow=menu||preview?'hidden':'';return()=>{document.body.style.overflow='';};},[menu,preview]);
 useEffect(()=>{if(!preview)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setPreview(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[preview]);

 return <>
 <header className="site-header"><a className="wordmark wordmark-logo" href="#top" aria-label="Aquamazone Adventure — accueil"><img src="/images/aquamazone-logo.png" alt="Aquamazone Adventure" width="2048" height="682" /></a><nav className="desktop-nav" aria-label={lang!=='en'?'Navigation principale':'Main navigation'}>{sections.map((section,i)=><a href={'#'+section} key={section}>{t.nav[i]}</a>)}</nav><div className="header-actions"><div className="language-picker"><button className="lang language-trigger" type="button" aria-label="Choisir la langue / Select language" aria-haspopup="listbox" aria-expanded={languageOpen} onClick={()=>setLanguageOpen(!languageOpen)}><Globe2 size={19} aria-hidden="true"/><span>{lang.toUpperCase()}</span><ChevronDown size={13} aria-hidden="true"/></button>{languageOpen&&<><button className="language-dismiss" aria-label="Fermer le choix de langue" onClick={()=>setLanguageOpen(false)}/><div className="language-options" role="listbox" aria-label="Langue du site">{languageOptions.map(option=><button type="button" role="option" aria-selected={lang===option.code} key={option.code} onClick={()=>{setLang(option.code);setLanguageOpen(false)}}><span>{option.label}</span><small>{option.code.toUpperCase()}</small></button>)}</div></>}</div><a className="header-book" href="#reservation">{t.book} <ArrowUpRight size={17}/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu?t.close:t.menu}>{menu?<X/>:<Menu/>}</button></div></header>
 {menu&&<nav id="mobile-menu" className="mobile-nav" aria-label={lang!=='en'?'Navigation mobile':'Mobile navigation'}>{sections.map((s,i)=><a onClick={()=>setMenu(false)} href={'#'+s} key={s}><span>0{i+1}</span>{t.nav[i]}<ArrowUpRight size={20}/></a>)}<a href="#reservation" onClick={()=>setMenu(false)}>{t.book}<ArrowRight/></a></nav>}
 <main id="top">
 <section className="hero hero-v3" aria-labelledby="hero-title">
 <div className="hero-photography" role="img" aria-label={lang!=='en'?'Photographie de la base nautique Aquamazone':'Photograph of the Aquamazone waterfront base'}/>
 <div className="hero-shade" aria-hidden="true"/>
 <div className="hero-v3-content">
  <p className="hero-v3-kicker">{lang==='es'?'ACTIVIDADES ACUÁTICAS':lang==='hi'?'जल गतिविधियाँ':lang==='en'?'WATERFRONT ADVENTURE':'BASE DE LOISIRS NAUTIQUES'}</p>
  <h1 id="hero-title">{lang==='es'?<>Descansa <em>junto al agua.</em></>:lang==='hi'?<>पानी के किनारे <em>सुकून।</em></>:lang==='en'?<>Relaxation <em>by the water.</em></>:<>La détente <em>au fil de l’eau.</em></>}</h1>
  <p className="hero-v3-description">{lang==='es'?'Actividades acuáticas, descanso y naturaleza en Adounko, Cotonú.':lang==='hi'?'अदुनको, कोटोनू में जल गतिविधियाँ, आराम और प्रकृति का आनंद।':lang==='en'?'Water activities, relaxation and nature discovery in Adounko, Cotonou.':'Activités nautiques, détente et découvertes naturelles à Adounko, Cotonou.'}</p>
  <div className="hero-v3-actions"><a className="yellow-button" href="#reservation">{lang==='es'?'Solicitar reserva':lang==='hi'?'बुकिंग का अनुरोध करें':lang==='en'?'Request a booking':'Demander une réservation'}<ArrowUpRight size={18}/></a><a className="hero-secondary" href="#activities">{t.explore}<ArrowDown size={17}/></a></div>
 </div>
 <div className="az-hero-info" aria-label={lang!=='en'?'Informations pratiques':'Visitor information'}>
  <span><MapPin size={13} aria-hidden="true"/>{lang!=='en'?'Adounko Village, Route des Pêches, Cotonou':'Adounko Village, Route des Pêches, Cotonou'}</span>
  <span><Clock size={13} aria-hidden="true"/>{lang==='es'?'Abierto sáb. / dom. y festivos, 11:00–18:00':lang==='hi'?'शनिवार / रविवार और छुट्टियों में खुला, 11:00–18:00':lang==='en'?'Open Sat / Sun & public holidays, 11am – 6pm':'Ouverts Sam / Dim et jours fériés, 11h – 18h'}</span>
  <span><UtensilsCrossed size={14} aria-hidden="true"/>{lang!=='en'?'Bar & Restaurant':'Bar & Restaurant'}</span>
 </div>
 <span className="image-disclosure">{lang!=='en'?'Photographie prise à Aquamazone':'Photographed at Aquamazone'}</span>
 </section>
 <section className="az-crossing-first" aria-labelledby="az-crossing-title">
   <div className="az-crossing-first-inner">
     <div className="az-crossing-first-copy">
       <p className="kicker">{lang!=='en'?'AVANT LES ACTIVITÉS':'BEFORE THE ACTIVITIES'}</p>
       <h2 id="az-crossing-title">{lang!=='en'?'Traversée en pirogue aller-retour obligatoire':'Mandatory return pirogue crossing'}</h2>
       <p>{lang!=='en'?'Pour rejoindre notre base nautique, chaque visiteur effectue la traversée aller-retour. Elle est déjà incluse dans tous nos forfaits : aucun supplément à payer.':'Every visitor takes the return pirogue crossing to reach our waterside base. All packages already include this crossing, so there is no additional charge.'}</p>
     </div>
     <div className="az-crossing-first-prices">
       <div><span>{lang!=='en'?'Adulte et 12 ans +':'Adults and ages 12+'}</span><strong>1 500 <small>FCFA</small></strong></div>
       <div><span>{lang!=='en'?'Enfant de moins de 12 ans':'Children under 12'}</span><strong>500 <small>FCFA</small></strong></div>
     </div>
   </div>
 </section>
 <section id="activities" className="activities activities-v3 section-shell">
 <div className="activity-v3-heading"><div><p className="kicker">{lang!=='en'?'02 / NOS ACTIVITÉS':'02 / OUR ACTIVITIES'}</p><h2>{lang!=='en'?'Des expériences uniques sur l’eau':'Unforgettable moments on the water'}</h2></div><p>{lang!=='en'?'Pédalo, kayak, paddle et bien plus encore. Trouvez l’expérience qui vous ressemble.':'Pedal boats, kayaks, paddleboards and more. Find your kind of adventure.'}</p></div>
 
 <div className="activity-vertical-list">
 {activities.map((a,i)=><article className="activity-list-item" key={a.id}>
   <span className="activity-list-index">{String(i+1).padStart(2,'0')}</span>
   <div className="activity-list-copy">
     <h3>{lang!=='en'?a.fr:a.en}</h3>
     <div className="activity-list-facts">{a.duration&&<span>{a.duration}</span>}{a.duration&&a.price&&<span aria-hidden="true">·</span>}{a.price&&<strong>{a.price}</strong>}</div>
     {a.note&&<p className={a.unavailable?'activity-list-alert':'activity-list-note'}>{lang!=='en'?a.note:(a.noteEn??a.note)}</p>}
     {!a.unavailable&&<a className="activity-list-link" href={a.id==='rental'?bookingWhatsApp:'#reservation'}
       target={a.id==='rental'?'_blank':undefined} rel={a.id==='rental'?'noopener noreferrer':undefined}
       onClick={()=>{if(a.id!=='rental'){
         const selectedActivity=a.id.startsWith('pedalo-')?'pedalo':a.id.startsWith('canoe-')?'canoe':
           ({boat:'pedalboat',ball:'waterball',tour:'lake'} as Record<string,string>)[a.id]??a.id;
         setReservationIntent(old=>({activity:selectedActivity,version:(old?.version??0)+1}));
       }}}>
       {lang!=='en'?'Demander une réservation':'Request a booking'}<ArrowUpRight size={15}/>
     </a>}
   </div>
   {activityVisuals[a.id]?
     <button className="activity-thumbnail" type="button" onClick={()=>setPreview(a.id)} aria-label={(lang!=='en'?'Agrandir la photo : ':'Expand photo: ')+(lang!=='en'?a.fr:a.en)}>
       <span className="activity-thumbnail-photo" style={{backgroundImage:`url("${activityVisuals[a.id]}")`}} aria-hidden="true"/>
       <span className="activity-thumbnail-zoom" aria-hidden="true"><ZoomIn size={17}/></span>
     </button>:
     <span className="activity-no-photo">{lang!=='en'?'Photo à venir':'Photo pending'}</span>}
 </article>)}
 </div>
  <p className="prototype-notice">{lang!=='en'?'Réservation et paiement en ligne en cours de développement. Pour le moment, demandez votre réservation sur WhatsApp.':'Online booking and payment are in development. For now, request bookings via WhatsApp.'}</p>
 </section>
 <section id="packages" className="packages packages-v4" aria-labelledby="packages-title">
 <div className="section-shell">
   <div className="packages-v4-heading">
     <div><p className="kicker">{lang!=='en'?'03 / NOS FORFAITS':'03 / OUR PACKAGES'}</p><h2 id="packages-title">{lang!=='en'?<>L’expérience <em>à votre façon.</em></>:<>Your kind of <em>adventure.</em></>}</h2></div>
     <p>{lang!=='en'?'Seul, à deux, en famille ou entre amis : choisissez votre façon de profiter du lac.':'Solo, as a couple, with family or friends: find the right way to enjoy the lake.'}</p>
   </div>
   <div className="packages-v4-featured packages-v6-featured">
     <article className="package-experience package-experience-solo">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">01 <span>{lang!=='en'?'FORFAIT':'PACKAGE'}</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>01 / 04</span><span>{lang!=='en'?'DÉCOUVERTE · PAR PERSONNE':'DISCOVERY · PER PERSON'}</span></div>
         <p className="package-experience-eyebrow">{lang!=='en'?'Le plaisir de découvrir':'Your first adventure'}</p>
         <h3>GLÈLÈ</h3>
         <p className="package-experience-intro">{lang!=='en'?'Une découverte pour les adultes et les enfants accompagnés.':'A discovery experience for adults and accompanied children.'}</p>
         <div className="package-experience-included">
            <strong>{lang!=='en'?'Ce forfait comprend :':'Included in this package:'}</strong>
            <ul>
              <li>{lang!=='en'?'Traversée en pirogue aller-retour':'Return pirogue crossing'}</li>
              <li>{lang!=='en'?'1 activité par personne au choix : canoë-kayak simple OU pédalo simple OU paddle/stand-up (30 min)':'ONE activity per person: single canoe-kayak OR single pedalo OR stand-up paddle (30 min)'}</li>
            </ul>
          </div>
         <p className="az-glele-safety">{lang==='fr'
           ?'Enfants de moins de 12 ans : accompagnement par un adulte obligatoire. L’accès aux activités dépend de leur capacité à manœuvrer en sécurité et de l’accord de l’équipe.'
           :'Children under 12 must be accompanied by an adult. Activity access depends on their ability to operate the equipment safely and staff approval.'}</p>
         <div className="package-experience-end">
           <div className="package-v6-prices"><span>{lang!=='en'?'Adulte':'Adult'} <strong>5 000 <small>FCFA</small></strong></span><span>{lang!=='en'?'Enfant':'Child'} <strong>3 500 <small>FCFA</small></strong></span></div>
           <a href="#reservation" aria-label={lang!=='en'?'Se renseigner sur le forfait GLÈLÈ':'Enquire about GLÈLÈ'}>{lang!=='en'?'Choisir GLÈLÈ':'Choose GLÈLÈ'}<ArrowUpRight size={18}/></a>
         </div>
       </div>
     </article>
     <article className="package-experience package-experience-couple">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">02 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>02 / 04</span><span>{lang!=='en'?'COUPLE · 2 PERSONNES':'COUPLE · 2 PEOPLE'}</span></div>
         <p className="package-experience-eyebrow">{lang!=='en'?'Deux fois plus de souvenirs':'Make memories together'}</p>
         <h3>GUÉZO</h3>
         <p className="package-experience-intro">{lang!=='en'?'Une aventure à partager, ensemble.':'An adventure made for two.'}</p>
         <div className="package-experience-included">
            <strong>{lang!=='en'?'Ce forfait comprend :':'Included in this package:'}</strong>
            <ul>
              <li>{lang!=='en'?'Traversée en pirogue aller-retour':'Return pirogue crossing'}</li>
              <li>{lang!=='en'?'Canoë-kayak double':'Double canoe-kayak'}</li>
              <li>{lang!=='en'?'Pédalo double':'Double pedalo'}</li>
              <li>{lang!=='en'?'Jus offert':'Complimentary juice'}</li>
            </ul>
          </div>
         <div className="package-experience-end"><div><span className="package-experience-small">{lang!=='en'?'Pour le couple':'Per couple'}</span><strong>12 000 <small>FCFA</small></strong></div><a href="#reservation" aria-label={lang!=='en'?'Se renseigner sur le forfait GUÉZO':'Enquire about GUÉZO'}>{lang!=='en'?'Choisir GUÉZO':'Choose GUÉZO'}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
   </div>
   <div className="packages-v5-extras" aria-label={lang!=='en'?'Forfaits famille et groupe':'Family and group packages'}>
     <article className="package-experience package-experience-family">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">04 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>03 / 04</span><span>{lang!=='en'?'FAMILLE · 2 ADULTES + 2 ENFANTS':'FAMILY · 2 ADULTS + 2 CHILDREN'}</span></div>
         <p className="package-experience-eyebrow">{lang!=='en'?'Des souvenirs ensemble':'Make memories together'}</p>
         <h3>TOFFA</h3>
         <p className="package-experience-intro">{lang!=='en'?'Une journée à partager en famille, au rythme de l’eau.':'A family day out, enjoyed at your own pace.'}</p>
         <div className="package-experience-included">
            <strong>{lang!=='en'?'Ce forfait comprend :':'Included in this package:'}</strong>
            <ul>
              <li>{lang!=='en'?'Traversée en pirogue aller-retour':'Return pirogue crossing'}</li>
              <li>{lang!=='en'?'Bateau à pédales familial (4 personnes)':'Family pedal-powered boat (4 people)'}</li>
              <li>{lang!=='en'?'Jus offert':'Complimentary juice'}</li>
            </ul>
          </div>
         <div className="package-experience-end"><div><span className="package-experience-small">{lang!=='en'?'Pour 2 adultes + 2 enfants':'For 2 adults + 2 children'}</span><strong>18 000 <small>FCFA</small></strong></div><a href="#reservation">{lang!=='en'?'Choisir TOFFA':'Choose TOFFA'}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
     <article className="package-experience package-experience-group">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">04 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>04 / 04</span><span>{lang!=='en'?'GROUPE · 4 ADULTES':'GROUP · 4 ADULTS'}</span></div>
         <p className="package-experience-eyebrow">{lang!=='en'?'L’aventure à plusieurs':'Adventure together'}</p>
         <h3>BÉHANZIN</h3>
         <p className="package-experience-intro">{lang!=='en'?'Une expérience complète à vivre entre amis.':'A complete water adventure with friends.'}</p>
         <div className="package-experience-included">
            <strong>{lang!=='en'?'Ce forfait comprend :':'Included in this package:'}</strong>
            <ul>
              <li>{lang!=='en'?'Traversée en pirogue aller-retour':'Return pirogue crossing'}</li>
              <li>{lang!=='en'?'Canoë-kayak double':'Double canoe-kayak'}</li>
              <li>{lang!=='en'?'Balade sur le lac':'Lake tour'}</li>
              <li>{lang!=='en'?'Pédalo':'Pedalo'}</li>
              <li>{lang!=='en'?'Jus offert':'Complimentary juice'}</li>
            </ul>
          </div>
         <div className="package-experience-end"><div><span className="package-experience-small">{lang!=='en'?'Pour 4 adultes':'For 4 adults'}</span><strong>36 000 <small>FCFA</small></strong></div><a href="#reservation">{lang!=='en'?'Choisir BÉHANZIN':'Choose BÉHANZIN'}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
   </div>
   <p className="packages-v4-footnote">{lang!=='en'?'Les traversées déjà incluses dans un forfait ne sont pas facturées une seconde fois. Réservations actuellement prises en charge via WhatsApp.':'Crossings included in a package are not charged a second time. Bookings are currently handled via WhatsApp.'}</p>
 </div>
 </section>
 <section id="restaurant" className="restaurant-v9" aria-labelledby="restaurant-title">
  <div className="restaurant-v9-shell">
    <div className="restaurant-v9-intro">
      <p className="kicker"><span aria-hidden="true">04 / </span>{lang!=='en'?'RESTAURANT & BAR':'RESTAURANT & BAR'}</p>
      <h2 id="restaurant-title">{lang!=='en'?<>Une pause gourmande <em>au bord de l’eau.</em></>:<>A delicious break <em>by the water.</em></>}</h2>
      <p>{lang!=='en'?'Après les activités, prenez le temps de savourer un bon repas dans un cadre paisible au bord de l’eau.':'After your activities, take time to enjoy a good meal in a peaceful waterfront setting.'}</p>
    </div>
    <div className="restaurant-v9-grid">
      <div className="restaurant-v9-visual">
        <div className="restaurant-v9-photo" role="img" aria-label={lang!=='en'?'Poisson braisé servi à Aquamazone':'Grilled fish served at Aquamazone'}/>
        <div className="restaurant-v9-photo-caption"><span>{lang!=='en'?'Une pause au bord de l’eau':'A break by the water'}</span><span>{lang!=='en'?'Poisson braisé · Aquamazone':'Grilled fish · Aquamazone'}</span></div>
      </div>
      <div className="restaurant-v9-menu">
        <div className="restaurant-v9-menu-top"><span>{lang!=='en'?'À LA CARTE':'ON THE MENU'}</span><span>ADOUNKO · BÉNIN</span></div>
        <div className="restaurant-v9-menu-group">
          <h3>{lang!=='en'?'Nos grillades':'From the grill'}</h3>
          <ul className="restaurant-v9-fish-list">
            <li><span>{lang!=='en'?<>Poissons (selon arrivages)<small>Bar, carpe braisés</small></>:<>Fish (subject to availability)<small>Grilled sea bass, carp</small></>}</span><strong>6 500 – 9 000 FCFA</strong></li>
            <li><span>{lang!=='en'?'Brochettes de poulet':'Chicken skewers'}</span><strong>6 000 FCFA</strong></li>
          </ul>
          <p className="restaurant-v9-included">{lang==='fr'
            ?'Chaque grillade comprend un accompagnement au choix. Le prix du poisson varie selon le type et la taille.'
            :'Each grilled dish includes one side of your choice. Fish prices vary by type and size.'}</p>
        </div>
        <div className="restaurant-v9-menu-group">
          <h3>{lang!=='en'?'Autres propositions':'Other selections'}</h3>
          <ul className="restaurant-v9-fish-list">
            <li><span>{lang!=='en'?'Gari Gnignan + œufs brouillés':'Gari Gnignan with scrambled eggs'}</span><strong>3 000 FCFA</strong></li>
          </ul>
        </div>
        <div className="restaurant-v9-menu-group">
          <h3>{lang!=='en'?'Accompagnements':'Sides'}</h3>
          <ul><li>{lang!=='en'?'Riz':'Rice'}</li><li>Aloco</li><li>{lang!=='en'?'Légumes sautés':'Sautéed vegetables'}</li><li>{lang!=='en'?'Pommes frites':'French fries'}</li><li>{lang!=='en'?'Pommes sautées':'Sautéed potatoes'}</li><li>{lang!=='en'?'Igname':'Yam'}</li><li>{lang!=='en'?'Patates douces':'Sweet potatoes'}</li></ul>
          <p className="restaurant-v9-extra">{lang!=='en'?'Portion supplémentaire : ':'Additional side portion: '}<strong>1 500 FCFA</strong></p>
        </div>
        <div className="restaurant-v9-menu-group restaurant-v9-menu-drinks">
          <h3>{lang!=='en'?'Boissons':'Drinks'}</h3>
          <ul className="restaurant-v9-fish-list restaurant-v9-drink-prices">
            <li><span>{lang!=='en'?'Sucreries':'Soft drinks'}</span><strong>1 000 – 1 500 FCFA</strong></li>
            <li><span>{lang!=='en'?'Cocktails':'Cocktails'}</span><strong>3 000 FCFA</strong></li>
            <li><span>{lang!=='en'?'Vins':'Wines'}</span><strong>9 000 – 15 000 FCFA</strong></li>
            <li><span>{lang!=='en'?'Champagne':'Champagne'}</span><strong>50 000 FCFA</strong></li>
            <li><span>{lang!=='en'?'Bières':'Beers'}</span><strong>1 500 – 2 000 FCFA</strong></li>
            <li><span>{lang!=='en'?'Eaux':'Water'}</span><strong>500 – 1 500 FCFA</strong></li>
            <li><span>{lang!=='en'?'Alcools':'Spirits'}</span><strong>1 000 – 3 000 FCFA</strong></li>
            <li><span>{lang!=='en'?'Thé chaud (thé vert / citronnelle)':'Hot tea (green tea / lemongrass)'}</span><strong>1 500 FCFA</strong></li>
            <li><span>{lang!=='en'?'Café':'Coffee'}</span><strong>1 500 FCFA</strong></li>
          </ul>
        </div>
        <div className="restaurant-v9-footer">
          <p>{lang!=='en'?'Pour commander à l’avance, le paiement intégral est obligatoire. La précommande en ligne n’est pas encore activée : contactez-nous pour connaître les modalités.':'Advance food orders require full payment. Online food pre-orders are not yet enabled; contact us for the current arrangements.'}</p>
          <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20me%20renseigner%20sur%20le%20restaurant%20Aquamazone." target="_blank" rel="noopener noreferrer">{lang!=='en'?'Contacter le restaurant':'Contact the restaurant'} <ArrowUpRight size={18}/></a>
        </div>
      </div>
    </div>
  </div>
</section>
<ImmersiveGallery lang={lang}/>
 <section id="location" className="location-v11" aria-labelledby="location-title">
  <div className="location-v11-shell">
    <div className="location-v11-heading">
      <p className="location-v11-kicker">06 / {lang!=='en'?'NOUS TROUVER':'FIND US'}</p>
      <h2 id="location-title">{lang!=='en'?<>Au bout de la Route des Pêches, <em>le lac vous attend.</em></>:<>At the end of the Coastal Road, <em>the lake awaits.</em></>}</h2>
      <p>{lang!=='en'?'Retrouvez AQUAMAZONE ADVENTURE au Village Adounko, à Cotonou.':'Find AQUAMAZONE ADVENTURE in Adounko Village, Cotonou.'}</p>
    </div>
    <LocationRouteVideo lang={lang}/>
    <div className="location-v11-layout">
      <div className="location-v11-map">
        <iframe title={lang!=='en'?'Carte de Togbin Plage, Bénin — zone de localisation d’Aquamazone':'Map of Togbin Plage, Benin — Aquamazone location area'} src="https://www.google.com/maps?q=Togbin+Plage,+Benin&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
        <a className="location-v11-map-link" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer"><MapPin size={17}/>{lang!=='en'?'Ouvrir dans Google Maps':'Open in Google Maps'}<ArrowUpRight size={17}/></a>
      </div>
      <div className="location-v11-directions">
        <div className="location-v11-address"><span>{lang!=='en'?'NOTRE ADRESSE':'OUR ADDRESS'}</span><strong>Village Adounko<br/>Route des Pêches<br/>Cotonou, Bénin</strong></div>
        <div className="location-v11-route">
          <div className="location-v11-route-head"><span>{lang!=='en'?'ITINÉRAIRE DEPUIS COTONOU':'DIRECTIONS FROM COTONOU'}</span><span>06 {lang!=='en'?'ÉTAPES':'STEPS'}</span></div>
          <ol>
            <li>{lang!=='en'?'Sur la Route des Pêches, après le Carrefour Club des Rois, continuez tout droit jusqu’au grand Carrefour Togbin Plage.':'Follow the Route des Pêches past Carrefour Club des Rois, continuing to the large Togbin Plage junction.'}</li>
            <li>{lang!=='en'?'Passez la station-service JBP.':'Pass the JBP service station.'}</li>
            <li>{lang!=='en'?'Continuez jusqu’à la prochaine intersection.':'Continue to the next intersection.'}</li>
            <li>{lang!=='en'?'Suivez les panneaux AQUAMAZONE.':'Follow the AQUAMAZONE signs.'}</li>
            <li>{lang!=='en'?'Tournez à droite et continuez jusqu’au lac.':'Turn right and continue towards the lake.'}</li>
            <li>{lang!=='en'?'Vous arriverez directement à notre embarcadère.':'You will arrive directly at our landing.'}</li>
          </ol>
        </div>
        <a className="location-v11-directions-cta" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer">{lang!=='en'?'Préparer mon itinéraire':'Get directions'}<ArrowUpRight size={19}/></a>
      </div>
    </div>
  </div>
</section>

<section id="visit" className="visit-v12" aria-labelledby="visit-title">
  <div className="visit-v12-shell">
    <div className="visit-v12-lead">
      <p className="visit-v12-eyebrow">07 / {lang!=='en'?'PRÉPARER VOTRE VISITE':'PLAN YOUR VISIT'}</p>
      <h2 id="visit-title">{lang!=='en'?<>Le bon moment <em>pour s’évader.</em></>:<>The perfect time <em>to get away.</em></>}</h2>
      <p className="visit-v12-intro">{lang!=='en'?'Les informations essentielles pour profiter pleinement de votre journée au bord de l’eau.':'Everything you need to know before spending your day by the water.'}</p>
    </div>
    <div className="visit-v12-grid">
      <div className="visit-v12-hours">
        <span className="visit-v12-overline">{lang!=='en'?'HORAIRES D’OUVERTURE':'OPENING HOURS'}</span>
        <div className="visit-v12-bigtime"><span>11<span className="visit-v12-unit">h</span></span><span className="visit-v12-dash" aria-hidden="true">—</span><span>18<span className="visit-v12-unit">h</span></span></div>
        <p className="visit-v12-days">{lang!=='en'?'Samedi · Dimanche · Jours fériés':'Saturday · Sunday · Public holidays'}</p>
        <p className="visit-v12-hours-note">{lang!=='en'?'Un week-end, un jour férié, une envie de prendre le large.':'Weekends, public holidays, and a chance to unwind.'}</p>
      </div>
      <div className="visit-v12-groups">
        <span className="visit-v12-overline">{lang!=='en'?'VISITES EN SEMAINE':'WEEKDAY VISITS'}</span>
        <div className="visit-v12-group-figure"><strong>06<span>+</span></strong><span>{lang!=='en'?'personnes':'people'}</span></div>
        <h3>{lang!=='en'?'L’aventure se partage.':'Better together.'}</h3>
        <p>{lang!=='en'?'En semaine, nous accueillons les groupes de 6 personnes minimum, sur réservation préalable. Une formule de 4 activités par personne est prévue.':'On weekdays, we welcome groups of at least 6 people with advance booking. A package of 4 activities per person applies.'}</p>
        <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20organiser%20une%20visite%20de%20groupe%20en%20semaine." target="_blank" rel="noopener noreferrer" className="visit-v12-link">{lang!=='en'?'Organiser une sortie en groupe':'Plan a group visit'}<ArrowUpRight size={18}/></a>
      </div>
    </div>
    <div className="visit-v12-practical">
      <div className="visit-v12-practical-heading"><span className="visit-v12-overline">{lang!=='en'?'BON À SAVOIR':'GOOD TO KNOW'}</span><h3>{lang!=='en'?'Avant de nous rejoindre':'Before you arrive'}</h3></div>
      <div className="visit-v12-practical-list">
        <div className="visit-v12-practical-item"><span className="visit-v12-num">01</span><div><h4>{lang!=='en'?'Traversée aller-retour':'Return boat crossing'}</h4><p>{lang!=='en'?'Adulte : 1 500 FCFA · Enfant de moins de 12 ans : 500 FCFA. La traversée est déjà incluse dans nos forfaits.':'Adult: 1,500 FCFA · Child under 12: 500 FCFA. The crossing is already included in our packages.'}</p></div></div>
        <div className="visit-v12-practical-item"><span className="visit-v12-num">02</span><div><h4>{lang!=='en'?'Restaurant & Bar':'Restaurant & Bar'}</h4><p>{lang!=='en'?'Pensez à confirmer votre commande avant votre arrivée afin de faciliter votre accueil.':'Please confirm your food order before arriving so we can better prepare for your visit.'}</p></div></div>
        <div className="visit-v12-practical-item"><span className="visit-v12-num">03</span><div><h4>{lang!=='en'?'Une question avant de venir ?':'Any questions before your visit?'}</h4><p>{lang!=='en'?'Notre équipe vous renseigne sur les activités, les forfaits et l’organisation de votre journée.':'Our team can help with activities, packages, and planning your day.'}</p></div></div>
      </div>
    </div>
    <div className="visit-v12-bottom">
      <div><span>{lang!=='en'?'BESOIN D’UN RENSEIGNEMENT ?':'NEED MORE INFORMATION?'}</span><strong>+229 01 54 28 44 44</strong></div>
      <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20des%20informations%20pour%20ma%20visite%20%C3%A0%20Aquamazone." target="_blank" rel="noopener noreferrer">{lang!=='en'?'Nous écrire sur WhatsApp':'Message us on WhatsApp'}<ArrowUpRight size={19}/></a>
    </div>
  </div>
</section>

<section id="faq" className="faq-v13" aria-labelledby="faq-title">
 <div className="faq-v13-shell">
  <div className="faq-v13-intro">
   <p className="faq-v13-eyebrow">08 / {lang!=='en'?'QUESTIONS FRÉQUENTES':'FREQUENTLY ASKED QUESTIONS'}</p>
   <h2 id="faq-title">{lang!=='en'?<>Tout savoir <em>avant de venir.</em></>:<>Everything to know <em>before you visit.</em></>}</h2>
   <p>{lang!=='en'?'Les réponses essentielles pour organiser votre expérience au bord de l’eau, en toute simplicité.':'The essentials for planning your day by the water, without the guesswork.'}</p>
   <div className="faq-v13-contact">
    <span>{lang!=='en'?'UNE AUTRE QUESTION ?':'SOMETHING ELSE?'}</span>
    <a href="https://wa.me/2290154284444?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20Aquamazone%20Adventure." target="_blank" rel="noopener noreferrer">{lang!=='en'?'Parlons sur WhatsApp':'Chat on WhatsApp'}<ArrowUpRight size={18} aria-hidden="true"/></a>
   </div>
  </div>
  <div className="faq-v13-questions">
   {faqItems.map((item,i)=><details className="faq-v13-item" key={i} name="aquamazone-faq" >
    <summary><span className="faq-v13-index">{String(i+1).padStart(2,'0')}</span><span className="faq-v13-question">{item.q[lang]}</span><span className="faq-v13-toggle" aria-hidden="true"><Plus size={19}/></span></summary>
    <div className="faq-v13-answer"><p>{item.a[lang]}</p></div>
   </details>)}
   <p className="faq-v13-footnote">{lang!=='en'?'Pour les détails particuliers à votre sortie, contactez directement notre équipe.':'For details specific to your visit, please contact our team directly.'}</p>
  </div>
 </div>
</section>
 <ReservationPlanner lang={contentLang} intent={reservationIntent}/>
 <VisitorReviews lang={contentLang}/>
 </main>
 <footer className="footer footer-v15" aria-label={lang!=='en'?'Pied de page':'Footer'}>
  <div className="footer-v15-inner">
    <div className="footer-v15-opening">
      <p>{lang!=='en'?'L’AVENTURE VOUS ATTEND':'ADVENTURE AWAITS'}</p>
      <h2>{lang!=='en'?<>On se retrouve <em>au bord de l’eau ?</em></>:<>See you <em>by the water?</em></>}</h2>
      <a href="#reservation">{lang!=='en'?'Préparer ma visite':'Plan my visit'} <ArrowUpRight size={20} aria-hidden="true"/></a>
    </div>
    <div className="footer-v15-columns">
      <div className="footer-v15-brand">
        <a href="#top" className="footer-v15-wordmark">AQUAMAZONE <span>ADVENTURE</span></a>
        <p>La détente au fil de l’eau.</p>
        <span>Village Adounko · Route des Pêches<br/>Cotonou, Bénin</span>
      </div>
      <nav aria-label={lang!=='en'?'Navigation du pied de page':'Footer navigation'}>
        <h3>{lang!=='en'?'DÉCOUVRIR':'EXPLORE'}</h3>
        <a href="#activities">{lang!=='en'?'Nos activités':'Activities'}</a>
        <a href="#packages">{lang!=='en'?'Nos forfaits':'Packages'}</a>
        <a href="#restaurant">Restaurant & Bar</a>
        <a href="#gallery">{lang!=='en'?'Galerie':'Gallery'}</a>
        <a href="#reservation">{lang!=='en'?'Préparer une visite':'Plan a visit'}</a>
      </nav>
      <nav aria-label={lang!=='en'?'Informations pratiques':'Visitor information'}>
        <h3>{lang!=='en'?'INFORMATIONS':'INFORMATION'}</h3>
        <a href="#location">{lang!=='en'?'Nous trouver':'Find us'}</a>
        <a href="#visit">{lang!=='en'?'Horaires & accès':'Opening hours'}</a>
        <a href="#faq">{lang!=='en'?'Questions fréquentes':'FAQ'}</a>
        <span>{lang!=='en'?'Sam., dim. & jours fériés':'Sat., Sun. & public holidays'}<br/>11h — 18h</span>
      </nav>
      <div className="footer-v15-contact">
        <h3>CONTACT</h3>
        <a href="tel:+2290154284444">+229 01 54 28 44 44</a>
        <a href="mailto:aquamazone229@gmail.com">aquamazone229@gmail.com</a>
        <a href="https://wa.me/2290154284444" target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true"/>WhatsApp <ArrowUpRight size={15} aria-hidden="true"/></a>
        <a href="https://www.instagram.com/aquamazoneadventure/" target="_blank" rel="noopener noreferrer"><Instagram size={17} aria-hidden="true"/>Instagram <ArrowUpRight size={15} aria-hidden="true"/></a>
        <a href="https://www.tiktok.com/@aquamazone1" target="_blank" rel="noopener noreferrer"><TikTokIcon/>TikTok <ArrowUpRight size={15} aria-hidden="true"/></a>
        <a href="https://www.youtube.com/@aquamazoneadventure229" target="_blank" rel="noopener noreferrer"><Youtube size={17} aria-hidden="true"/>YouTube <ArrowUpRight size={15} aria-hidden="true"/></a>
      </div>
    </div>
    <div className="footer-v15-bottom"><span>© {new Date().getFullYear()} AQUAMAZONE Adventure</span><span>{lang!=='en'?'Tous droits réservés.':'All rights reserved.'}</span><a href="#top">{lang!=='en'?'Retour en haut':'Back to top'} ↑</a></div>
  </div>
</footer>
 {preview&&<div className="activity-lightbox" role="presentation" onClick={()=>setPreview(null)}>
  <div className="activity-lightbox-dialog" role="dialog" aria-modal="true" aria-label={lang!=='en'?'Aperçu photo':'Image preview'} onClick={event=>event.stopPropagation()}>
    <button className="activity-lightbox-close" type="button" onClick={()=>setPreview(null)} aria-label={lang!=='en'?'Fermer l’image':'Close image'}><X size={22}/></button>
    <img src={activityVisuals[preview]} alt={lang!=='en'?'Photographie de l’activité à Aquamazone':'Activity photographed at Aquamazone'} />
    <p>{lang!=='en'?'Photographie prise à Aquamazone':'Photographed at Aquamazone'}</p>
  </div>
 </div>}
 <AquamazoneAssistant lang={lang}/>
 </>}
