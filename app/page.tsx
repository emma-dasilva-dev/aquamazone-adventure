'use client';
import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUpRight,ArrowRight,Menu,X,Plus,Minus,MapPin,Clock,MessageCircle,Waves,ZoomIn} from 'lucide-react';

type Lang='fr'|'en';
const activities=[
 {id:'pedalo',fr:'Pédalo',en:'Pedal boat',duration:'30 min',price:'3 000 FCFA / personne',note:''},
 {id:'kayak',fr:'Canoë / Kayak',en:'Canoe / Kayak',duration:'30 min',price:'3 000 FCFA / personne',note:''},
 {id:'paddle',fr:'Paddle / Stand Up',en:'Stand-up paddle',duration:'30 min',price:'3 000 FCFA',note:''},
 {id:'boat',fr:'Bateau à pédales',en:'Pedal-powered boat',duration:'30 min',price:'5 000 FCFA / personne (2 pers.)',note:'Dès 3 personnes : 3 000 FCFA / personne'},
 {id:'ball',fr:'Bulle gonflable / Water Ball',en:'Inflatable water ball',duration:'20 min',price:'3 000 FCFA / personne',note:''},
 {id:'tour',fr:'Balade sur l’eau / Mangrove',en:'Lagoon / Mangrove tour',duration:'30–45 min',price:'5 000 FCFA / adulte',note:'Enfant de moins de 12 ans : 2 500 FCFA'},
 {id:'jetski',fr:'Jet-ski',en:'Jet ski',duration:'',price:'',note:'Indisponible — maintenance',unavailable:true},
 {id:'rental',fr:'Location embarcation + moteur + machiniste',en:'Boat, motor and operator hire',duration:'Demi-journée / journée',price:'Sur devis',note:'Réservation obligatoire'}
];
const copy={fr:{nav:['Activités','Forfaits','Restaurant','Galerie','Localisation'],book:'Réserver',hero:'La détente au fil de l’eau.',explore:'Explorer les activités',eyebrow:'VOTRE PROCHAINE ÉVASION',intro:'L’aventure commence ici.',desc:'Des expériences nautiques, des moments à partager et un cadre naturel à découvrir.',activity:'Choisissez votre aventure',activitySub:'Découvrez les activités et leurs tarifs. Les photographies officielles seront ajoutées prochainement.',featured:'À DÉCOUVRIR',packages:'Nos forfaits expériences',food:'Une pause gourmande au bord de l’eau',gallery:'Des souvenirs à vivre',location:'Comment nous trouver',hours:'Samedi, dimanche et jours fériés · 11h00–18h00',cta:'Préparer ma visite',placeholder:'Photographie Aquamazone à intégrer',ask:'Une question ?',chat:'Assistant Aquamazone',chatWelcome:'Bonjour ! Je peux vous renseigner sur nos horaires, tarifs et notre localisation.',chatQuestions:['Quels sont vos horaires ?','Où êtes-vous situés ?','Combien coûte le pédalo ?'],close:'Fermer',menu:'Ouvrir le menu'},en:{nav:['Activities','Packages','Restaurant','Gallery','Location'],book:'Book',hero:'Relaxation by the water.',explore:'Explore activities',eyebrow:'YOUR NEXT ESCAPE',intro:'Adventure starts here.',desc:'Water activities, moments together and a natural setting to discover.',activity:'Choose your adventure',activitySub:'Explore activities and prices. Official photos will be added soon.',featured:'EXPLORE',packages:'Experience packages',food:'A delicious break by the water',gallery:'Memories in the making',location:'Find us',hours:'Saturday, Sunday and public holidays · 11am–6pm',cta:'Plan my visit',placeholder:'Aqu​amazone photo to be added',ask:'Need help?',chat:'Aquamazone Assistant',chatWelcome:'Hello! I can help with our opening hours, prices and location.',chatQuestions:['What are your opening hours?','Where are you located?','How much is pedal boating?'],close:'Close',menu:'Open menu'}};
const sections=['activities','packages','restaurant','gallery','location'];
const bookingWhatsApp='https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20activit%C3%A9%20%C3%A0%20Aquamazone.';
// Temporary stock photography. Replace with verified Aquamazone-owned photographs before launch.
const activityVisuals:Record<string,string>={
 pedalo:'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1100&q=80&auto=format&fit=crop',
 kayak:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1100&q=80&auto=format&fit=crop',
 paddle:'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1100&q=80&auto=format&fit=crop',
 boat:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1100&q=80&auto=format&fit=crop',
 ball:'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1100&q=80&auto=format&fit=crop'
};
export default function Home(){
 const [lang,setLang]=useState<Lang>('fr');const [menu,setMenu]=useState(false);const [active,setActive]=useState('pedalo');const [chat,setChat]=useState(false);const [question,setQuestion]=useState<number|null>(null);const [preview,setPreview]=useState<string|null>(null);const t=copy[lang];const chosen=activities.find(a=>a.id===active)!;
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{document.body.style.overflow=menu||preview?'hidden':'';return()=>{document.body.style.overflow='';};},[menu,preview]);
 useEffect(()=>{if(!preview)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setPreview(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[preview]);
 const responses=lang==='fr'?['Nous sommes ouverts de 11h à 18h les samedis, dimanches et jours fériés.','Nous sommes à Adounko Village, Route des Pêches, Cotonou, Bénin.','Le pédalo coûte 3 000 FCFA par personne pour 30 minutes.']:['We open 11am–6pm on Saturdays, Sundays and public holidays.','We are in Adounko Village, Route des Pêches, Cotonou, Benin.','Pedal boating costs 3,000 FCFA per person for 30 minutes.'];
 return <>
 <header className="site-header"><a className="wordmark" href="#top" aria-label="Aquamazone Adventure — accueil"><span>AQUAMAZONE</span><small>ADVENTURE <span aria-hidden="true">/</span> BENIN</small></a><nav className="desktop-nav" aria-label={lang==='fr'?'Navigation principale':'Main navigation'}>{sections.map((section,i)=><a href={'#'+section} key={section}>{t.nav[i]}</a>)}</nav><div className="header-actions"><button className="lang" onClick={()=>setLang(lang==='fr'?'en':'fr')} aria-label={lang==='fr'?'Switch to English':'Passer en français'}><span className="lang-current">{lang.toUpperCase()}</span><span aria-hidden="true" className="lang-divider">/</span><span className="lang-alternate">{lang==='fr'?'EN':'FR'}</span></button><a className="header-book" href={bookingWhatsApp} target="_blank" rel="noopener noreferrer">{t.book} <ArrowUpRight size={17}/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu?t.close:t.menu}>{menu?<X/>:<Menu/>}</button></div></header>
 {menu&&<nav id="mobile-menu" className="mobile-nav" aria-label={lang==='fr'?'Navigation mobile':'Mobile navigation'}>{sections.map((s,i)=><a onClick={()=>setMenu(false)} href={'#'+s} key={s}><span>0{i+1}</span>{t.nav[i]}<ArrowUpRight size={20}/></a>)}<a href={bookingWhatsApp} target="_blank" rel="noopener noreferrer" onClick={()=>setMenu(false)}>{t.book}<ArrowRight/></a></nav>}
 <main id="top">
 <section className="hero hero-v3" aria-labelledby="hero-title">
 <div className="hero-photography" role="img" aria-label={lang==='fr'?'Photographie de paysage illustrative, à remplacer par une photo officielle Aquamazone':'Illustrative landscape photography, to be replaced with an official Aquamazone photograph'}/>
 <div className="hero-shade" aria-hidden="true"/>
 <div className="hero-v3-content">
  <p className="hero-v3-kicker">{lang==='fr'?'BASE DE LOISIRS NAUTIQUES':'WATERFRONT ADVENTURE'}</p>
  <h1 id="hero-title">{lang==='fr'?<>La détente <em>au fil de l’eau.</em></>:<>Relaxation <em>by the water.</em></>}</h1>
  <p className="hero-v3-description">{lang==='fr'?'Activités nautiques, détente et découvertes naturelles à Adounko, Cotonou.':'Water activities, relaxation and nature discovery in Adounko, Cotonou.'}</p>
  <div className="hero-v3-actions"><a className="yellow-button" href={bookingWhatsApp} target="_blank" rel="noopener noreferrer">{lang==='fr'?'Demander une réservation':'Request a booking'}<ArrowUpRight size={18}/></a><a className="hero-secondary" href="#activities">{t.explore}<ArrowDown size={17}/></a></div>
 </div>
 <div className="hero-v3-bottom"><div><MapPin size={20}/><span>Adounko Village<br/>Route des Pêches, Cotonou</span></div><div><Clock size={20}/><span>{lang==='fr'?'Sam. · Dim. · Jours fériés':'Sat. · Sun. · Public holidays'}<br/>11h – 18h</span></div><div><MessageCircle size={20}/><span>{lang==='fr'?'Bar & Restaurant':'Bar & Restaurant'}<br/>{lang==='fr'?'Ouvert les week-ends et jours fériés':'Open weekends & public holidays'}</span></div></div>
 <span className="image-disclosure">{lang==='fr'?'Photo d’illustration · Visuels officiels à venir':'Illustrative photo · Official media coming soon'}</span>
 </section>
 <section id="activities" className="activities activities-v3 section-shell">
 <div className="activity-v3-heading"><div><p className="kicker">{lang==='fr'?'NOS ACTIVITÉS':'OUR ACTIVITIES'}</p><h2>{lang==='fr'?'Des expériences uniques sur l’eau':'Unforgettable moments on the water'}</h2></div><p>{lang==='fr'?'Pédalo, kayak, paddle et bien plus encore. Trouvez l’expérience qui vous ressemble.':'Pedal boats, kayaks, paddleboards and more. Find your kind of adventure.'}</p></div>
 <p className="visual-warning">{lang==='fr'?'Photographies d’illustration — elles ne représentent pas le site Aquamazone.':'Illustrative stock photography — not images of the Aquamazone location.'}</p>
 <div className="activity-vertical-list">
 {activities.map((a,i)=><article className="activity-list-item" key={a.id}>
   <span className="activity-list-index">{String(i+1).padStart(2,'0')}</span>
   <div className="activity-list-copy">
     <h3>{lang==='fr'?a.fr:a.en}</h3>
     <div className="activity-list-facts">{a.duration&&<span>{a.duration}</span>}{a.duration&&a.price&&<span aria-hidden="true">·</span>}{a.price&&<strong>{a.price}</strong>}</div>
     {a.note&&<p className={a.unavailable?'activity-list-alert':'activity-list-note'}>{a.note}</p>}
     {!a.unavailable&&<a className="activity-list-link" href={bookingWhatsApp} target="_blank" rel="noopener noreferrer">{lang==='fr'?'Demander une réservation':'Request a booking'}<ArrowUpRight size={15}/></a>}
   </div>
   {activityVisuals[a.id]?
     <button className="activity-thumbnail" type="button" onClick={()=>setPreview(a.id)} aria-label={(lang==='fr'?'Agrandir la photo illustrative : ':'Expand illustrative image: ')+(lang==='fr'?a.fr:a.en)}>
       <span className="activity-thumbnail-photo" style={{backgroundImage:`url("${activityVisuals[a.id]}")`}} aria-hidden="true"/>
       <span className="activity-thumbnail-zoom" aria-hidden="true"><ZoomIn size={17}/></span>
     </button>:
     <span className="activity-no-photo">{lang==='fr'?'Photo à venir':'Photo pending'}</span>}
 </article>)}
 </div>
  <p className="prototype-notice">{lang==='fr'?'Réservation et paiement en ligne en cours de développement. Pour le moment, demandez votre réservation sur WhatsApp.':'Online booking and payment are in development. For now, request bookings via WhatsApp.'}</p>
 </section>
 <section id="packages" className="packages"><div className="section-shell"><p className="kicker">03 / AQUAMAZONE</p><h2>{t.packages}</h2><div className="package-list">{[['GLÈLÈ','SOLO','5 000 FCFA / adulte · 3 500 FCFA / enfant'],['GUÉZO','COUPLE','12 000 FCFA'],['TOFFA','FAMILLE',lang==='fr'?'Tarif à confirmer':'Price to confirm'],['BÉHANZIN','GROUPE / VIP','36 000 FCFA']].map(([name,type,price],i)=><div className="package-row" key={name}><span>0{i+1}</span><h3>{name}</h3><span>{type}</span><strong>{price}</strong></div>)}</div></div></section>
 <section id="restaurant" className="restaurant section-shell"><div className="restaurant-photo"><Waves size={52} strokeWidth={1}/><span>{t.placeholder}</span></div><div className="restaurant-copy"><p className="kicker">04 / RESTAURANT & BAR</p><h2>{t.food}</h2><p>Bar braisé · Carpe braisée · Brochettes de poulet</p><p>Riz · Aloco · Légumes sautés · Pommes frites · Pommes sautées · Igname · Patates douces</p><p className="small">{lang==='fr'?'Nous vous recommandons de confirmer votre commande avant votre arrivée.':'We recommend confirming your order before arriving.'}</p></div></section>
 <section id="gallery" className="gallery section-shell"><p className="kicker">05 / GALERIE</p><h2>{t.gallery}</h2><div className="gallery-grid"><div className="gallery-placeholder wide">{t.placeholder}</div><div className="gallery-placeholder">{t.placeholder}</div><div className="gallery-placeholder video">{lang==='fr'?'Vidéo Aquamazone à intégrer':'Aqu​amazone video to be added'}</div></div></section>
 <section id="location" className="location section-shell"><div><p className="kicker">06 / LOCALISATION</p><h2>{t.location}</h2><p>Adounko Village, Route des Pêches, Cotonou, Bénin.</p><p><Clock size={17}/>{t.hours}</p><a className="inline-link" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer"><MapPin size={18}/> Google Maps <ArrowUpRight size={18}/></a></div><div className="map-placeholder"><MapPin size={45}/><span>{lang==='fr'?'Carte à intégrer après vérification du point exact':'Map to be added after pin verification'}</span></div></section>
 </main>
 <footer className="footer"><div className="section-shell"><div className="footer-top"><div><h2>AQUAMAZONE <small>ADVENTURE</small></h2><p>Base de loisirs nautiques au Village Adounko.</p><em>« La détente au fil de l’eau. »</em></div><div><h3>Contact</h3><a href="tel:+2290154284444">+229 01 54 28 44 44</a><a href="mailto:aquamazone229@gmail.com">aquamazone229@gmail.com</a><a href="https://wa.me/2290154284444">WhatsApp</a></div><div><h3>Réseaux</h3><a href="https://www.youtube.com/@aquamazoneadventure229" target="_blank" rel="noopener noreferrer">YouTube</a><span>Instagram · TikTok · Facebook : liens à confirmer</span></div></div><div className="footer-bottom">© 2026 AQUAMAZONE Adventure. Tous droits réservés.</div></div></footer>
 {preview&&<div className="activity-lightbox" role="presentation" onClick={()=>setPreview(null)}>
  <div className="activity-lightbox-dialog" role="dialog" aria-modal="true" aria-label={lang==='fr'?'Aperçu photo':'Image preview'} onClick={event=>event.stopPropagation()}>
    <button className="activity-lightbox-close" type="button" onClick={()=>setPreview(null)} aria-label={lang==='fr'?'Fermer l’image':'Close image'}><X size={22}/></button>
    <img src={activityVisuals[preview]} alt={lang==='fr'?'Photographie illustrative de paysage (pas une photo d’Aquamazone)':'Illustrative landscape photo (not Aquamazone)'} />
    <p>{lang==='fr'?'Photographie illustrative · Visuel officiel Aquamazone à venir':'Illustrative photography · Official Aquamazone image coming soon'}</p>
  </div>
 </div>}
 <button className="chat-launcher" aria-label={chat?t.close:t.ask} aria-expanded={chat} onClick={()=>setChat(!chat)}>{chat?<X size={23}/>:<MessageCircle size={24}/>}</button>
 {chat&&<aside className="chat-panel" aria-label={t.chat}><div className="chat-head"><span><Waves size={19}/>{t.chat}</span><button aria-label={t.close} onClick={()=>setChat(false)}><X size={21}/></button></div><div className="chat-body"><p className="bot-bubble">{t.chatWelcome}</p><div className="suggestions">{t.chatQuestions.map((q,i)=><button onClick={()=>setQuestion(i)} key={q}>{q}<ArrowUpRight size={15}/></button>)}</div>{question!==null&&<><p className="user-bubble">{t.chatQuestions[question]}</p><p className="bot-bubble">{responses[question]}</p></>}<p className="chat-disclaimer">{lang==='fr'?'Aperçu de réponses vérifiées. L’IA conversationnelle sera connectée ultérieurement.':'Preview of verified answers. Conversational AI will be connected later.'}</p><a className="inline-link" href="https://wa.me/2290154284444" target="_blank" rel="noopener noreferrer">WhatsApp <ArrowUpRight size={16}/></a></div></aside>}
 </>}
