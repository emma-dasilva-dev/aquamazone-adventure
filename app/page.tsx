'use client';
import {useEffect,useState} from 'react';
import ImmersiveGallery from './ImmersiveGallery';
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

const faqItems=[
 {q:{fr:'Quels sont vos jours et horaires d’ouverture ?',en:'When are you open?'},a:{fr:'Nous sommes ouverts les samedis, dimanches et jours fériés, de 11h à 18h.',en:'We are open on Saturdays, Sundays and public holidays, from 11am to 6pm.'}},
 {q:{fr:'Peut-on venir en semaine ?',en:'Can we visit during the week?'},a:{fr:'Oui, les visites en semaine sont possibles pour les groupes de 6 personnes minimum, sur réservation préalable, avec une formule de 4 activités par personne. Contactez-nous sur WhatsApp pour organiser votre sortie.',en:'Yes. Weekday visits are available for groups of at least 6 people by advance reservation, with a package of 4 activities per person. Contact us on WhatsApp to arrange your visit.'}},
 {q:{fr:'Où se trouve AQUAMAZONE ADVENTURE ?',en:'Where is AQUAMAZONE ADVENTURE located?'},a:{fr:'Au Village Adounko, sur la Route des Pêches à Cotonou, au Bénin. Depuis le Carrefour Club des Rois, continuez vers le grand Carrefour Togbin Plage, passez la station JBP puis suivez les panneaux AQUAMAZONE vers le lac et l’embarcadère.',en:'In Adounko Village on the Route des Pêches in Cotonou, Benin. From Carrefour Club des Rois, continue towards the large Togbin Plage junction, pass the JBP station, then follow the AQUAMAZONE signs towards the lake and landing.'}},
 {q:{fr:'La traversée en pirogue est-elle payante ?',en:'Is the return boat crossing charged separately?'},a:{fr:'La traversée aller-retour coûte 1 500 FCFA par adulte et 500 FCFA par enfant de moins de 12 ans. Elle est déjà incluse dans les forfaits : vous ne la payez pas une deuxième fois.',en:'The return crossing costs 1,500 FCFA per adult and 500 FCFA per child under 12. It is already included in our packages, so you do not pay for it twice.'}},
 {q:{fr:'Quelles activités peut-on faire sur place ?',en:'What activities are available?'},a:{fr:'Nous proposons notamment le pédalo, le canoë-kayak, le paddle, le bateau à pédales, la bulle gonflable, ainsi que des balades sur le lac et la découverte des mangroves. Le jet-ski est actuellement indisponible pour maintenance.',en:'Our experiences include pedal boats, canoeing and kayaking, stand-up paddle, pedal-powered boats, inflatable water balls, lake outings and mangrove discovery. Jet skiing is currently unavailable due to maintenance.'}},
 {q:{fr:'Comment choisir un forfait sans confusion ?',en:'How do I know exactly what a package includes?'},a:{fr:'Chaque forfait indique le nombre de participants, son tarif et les activités incluses. Pour le forfait solo GLÈLÈ, choisissez une seule activité : canoë simple OU pédalo simple (30 min). La traversée est incluse. Pour toute précision sur un autre forfait, contactez notre équipe.',en:'Each package states the number of guests, the price and the included activities. The GLÈLÈ solo package includes ONE 30-minute activity: a single canoe OR a single pedal boat. The crossing is included. Contact our team to confirm details of other packages.'}},
 {q:{fr:'Peut-on manger au restaurant ?',en:'Is food available at the restaurant?'},a:{fr:'Oui, notre Restaurant & Bar propose notamment des poissons braisés, des brochettes de poulet, des accompagnements et des boissons fraîches. Nous vous recommandons de confirmer votre commande avant votre arrivée.',en:'Yes. Our Restaurant & Bar offers grilled fish, chicken skewers, sides and cold drinks. We recommend confirming your order before you arrive.'}},
 {q:{fr:'Comment réserver ou poser une question ?',en:'How can I book or ask a question?'},a:{fr:'Écrivez-nous sur WhatsApp au +229 01 54 28 44 44 pour organiser votre visite ou vérifier les disponibilités. La réservation avec paiement directement sur le site n’est pas encore active.',en:'Message us on WhatsApp at +229 01 54 28 44 44 to plan your visit or check availability. Online booking and payment through this website are not yet active.'}}
] as const;

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
 const [lang,setLang]=useState<Lang>('fr');const [menu,setMenu]=useState(false);const [chat,setChat]=useState(false);const [question,setQuestion]=useState<number|null>(null);const [preview,setPreview]=useState<string|null>(null);const t=copy[lang];
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
 <div className="activity-v3-heading"><div><p className="kicker">{lang==='fr'?'02 / NOS ACTIVITÉS':'02 / OUR ACTIVITIES'}</p><h2>{lang==='fr'?'Des expériences uniques sur l’eau':'Unforgettable moments on the water'}</h2></div><p>{lang==='fr'?'Pédalo, kayak, paddle et bien plus encore. Trouvez l’expérience qui vous ressemble.':'Pedal boats, kayaks, paddleboards and more. Find your kind of adventure.'}</p></div>
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
 <section id="packages" className="packages packages-v4" aria-labelledby="packages-title">
 <div className="section-shell">
   <div className="packages-v4-heading">
     <div><p className="kicker">{lang==='fr'?'03 / NOS FORFAITS':'03 / OUR PACKAGES'}</p><h2 id="packages-title">{lang==='fr'?<>L’expérience <em>à votre façon.</em></>:<>Your kind of <em>adventure.</em></>}</h2></div>
     <p>{lang==='fr'?'Seul, à deux, en famille ou entre amis : choisissez votre façon de profiter du lac.':'Solo, as a couple, with family or friends: find the right way to enjoy the lake.'}</p>
   </div>
   <div className="packages-v4-featured packages-v6-featured">
     <article className="package-experience package-experience-solo">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">01 <span>{lang==='fr'?'PERSONNE':'PERSON'}</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>01 / 04</span><span>{lang==='fr'?'SOLO · 1 PERSONNE':'SOLO · 1 PERSON'}</span></div>
         <p className="package-experience-eyebrow">{lang==='fr'?'Le plaisir de découvrir':'Your first adventure'}</p>
         <h3>GLÈLÈ</h3>
         <p className="package-experience-intro">{lang==='fr'?'Une première escapade sur l’eau, à votre rythme.':'Your first escape on the water, at your own pace.'}</p>
         <div className="package-experience-included"><strong>{lang==='fr'?'Traversée aller-retour incluse':'Return crossing included'}</strong><br/><strong>{lang==='fr'?'1 activité au choix':'Choose 1 activity'}</strong> : {lang==='fr'?'canoë simple OU pédalo simple (30 min)':'single canoe OR single pedalo (30 min)'}</div>
         <div className="package-experience-end">
           <div className="package-v6-prices"><span>{lang==='fr'?'Adulte':'Adult'} <strong>5 000 <small>FCFA</small></strong></span><span>{lang==='fr'?'Enfant':'Child'} <strong>3 500 <small>FCFA</small></strong></span></div>
           <a href={bookingWhatsApp} target="_blank" rel="noopener noreferrer" aria-label={lang==='fr'?'Se renseigner sur le forfait GLÈLÈ':'Enquire about GLÈLÈ'}>{lang==='fr'?'Choisir GLÈLÈ':'Choose GLÈLÈ'}<ArrowUpRight size={18}/></a>
         </div>
       </div>
     </article>
     <article className="package-experience package-experience-couple">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">02 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>02 / 04</span><span>{lang==='fr'?'COUPLE · 2 PERSONNES':'COUPLE · 2 PEOPLE'}</span></div>
         <p className="package-experience-eyebrow">{lang==='fr'?'Deux fois plus de souvenirs':'Make memories together'}</p>
         <h3>GUÉZO</h3>
         <p className="package-experience-intro">{lang==='fr'?'Une aventure à partager, ensemble.':'An adventure made for two.'}</p>
         <div className="package-experience-included"><strong>{lang==='fr'?'Traversée aller-retour incluse':'Return crossing included'}</strong><br/>{lang==='fr'?'Canoë double ET pédalo double · Eau offerte':'Double canoe AND double pedalo · Complimentary water'}</div>
         <div className="package-experience-end"><div><span className="package-experience-small">{lang==='fr'?'Pour le couple':'Per couple'}</span><strong>12 000 <small>FCFA</small></strong></div><a href={bookingWhatsApp} target="_blank" rel="noopener noreferrer" aria-label={lang==='fr'?'Se renseigner sur le forfait GUÉZO':'Enquire about GUÉZO'}>{lang==='fr'?'Choisir GUÉZO':'Choose GUÉZO'}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
   </div>
   <div className="packages-v5-extras" aria-label={lang==='fr'?'Forfaits famille et groupe':'Family and group packages'}>
     <article className="package-experience package-experience-family">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">04 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>03 / 04</span><span>{lang==='fr'?'FAMILLE · 2 ADULTES + 2 ENFANTS':'FAMILY · 2 ADULTS + 2 CHILDREN'}</span></div>
         <p className="package-experience-eyebrow">{lang==='fr'?'Des souvenirs ensemble':'Make memories together'}</p>
         <h3>TOFFA</h3>
         <p className="package-experience-intro">{lang==='fr'?'Une journée à partager en famille, au rythme de l’eau.':'A family day out, enjoyed at your own pace.'}</p>
         <div className="package-experience-end"><div><span className="package-experience-small">{lang==='fr'?'Tarif et activités':'Price and activities'}</span><strong>{lang==='fr'?'À confirmer':'To confirm'}</strong><span className="package-experience-muted">{lang==='fr'?'Confirmation auprès de l’équipe':'Please confirm with our team'}</span></div><a href={bookingWhatsApp} target="_blank" rel="noopener noreferrer">{lang==='fr'?'Découvrir le forfait':'Explore this package'}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
     <article className="package-experience package-experience-group">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">04 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>04 / 04</span><span>{lang==='fr'?'GROUPE · 4 ADULTES':'GROUP · 4 ADULTS'}</span></div>
         <p className="package-experience-eyebrow">{lang==='fr'?'L’aventure à plusieurs':'Adventure together'}</p>
         <h3>BÉHANZIN</h3>
         <p className="package-experience-intro">{lang==='fr'?'Une expérience complète à vivre entre amis.':'A complete water adventure with friends.'}</p>
         <div className="package-experience-included">{lang==='fr'?'Traversée A/R · Canoë double · Balade sur le lac · Pédalo · Eau offerte':'Return crossing · Double canoe · Lake tour · Pedalo · Complimentary water'}</div>
         <div className="package-experience-end"><div><span className="package-experience-small">{lang==='fr'?'Pour 4 adultes':'For 4 adults'}</span><strong>36 000 <small>FCFA</small></strong></div><a href={bookingWhatsApp} target="_blank" rel="noopener noreferrer">{lang==='fr'?'Choisir BÉHANZIN':'Choose BÉHANZIN'}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
   </div>
   <p className="packages-v4-footnote">{lang==='fr'?'Les traversées déjà incluses dans un forfait ne sont pas facturées une seconde fois. Réservations actuellement prises en charge via WhatsApp.':'Crossings included in a package are not charged a second time. Bookings are currently handled via WhatsApp.'}</p>
 </div>
 </section>
 <section id="restaurant" className="restaurant-v9" aria-labelledby="restaurant-title">
  <div className="restaurant-v9-shell">
    <div className="restaurant-v9-intro">
      <p className="kicker"><span aria-hidden="true">04 / </span>{lang==='fr'?'RESTAURANT & BAR':'RESTAURANT & BAR'}</p>
      <h2 id="restaurant-title">{lang==='fr'?<>Une pause gourmande <em>au bord de l’eau.</em></>:<>A delicious break <em>by the water.</em></>}</h2>
      <p>{lang==='fr'?'Après les activités, prenez le temps de savourer un bon repas dans un cadre paisible au bord de l’eau.':'After your activities, take time to enjoy a good meal in a peaceful waterfront setting.'}</p>
    </div>
    <div className="restaurant-v9-grid">
      <div className="restaurant-v9-visual">
        <div className="restaurant-v9-photo" role="img" aria-label={lang==='fr'?'Photographie culinaire illustrative, pas une photo du restaurant Aquamazone':'Illustrative food photography, not an Aquamazone restaurant photograph'}/>
        <div className="restaurant-v9-photo-caption"><span>{lang==='fr'?'Une pause au bord de l’eau':'A break by the water'}</span><span>{lang==='fr'?'Photo illustrative · À remplacer':'Illustrative photo · To replace'}</span></div>
      </div>
      <div className="restaurant-v9-menu">
        <div className="restaurant-v9-menu-top"><span>{lang==='fr'?'À LA CARTE':'ON THE MENU'}</span><span>ADOUNKO · BÉNIN</span></div>
        <div className="restaurant-v9-menu-group">
          <h3>{lang==='fr'?'Nos grillades':'From the grill'}</h3>
          <ul><li>{lang==='fr'?'Bar braisé':'Grilled sea bass'}</li><li>{lang==='fr'?'Carpe braisée':'Grilled carp'}</li><li>{lang==='fr'?'Brochettes de poulet':'Chicken skewers'}</li></ul>
        </div>
        <div className="restaurant-v9-menu-group">
          <h3>{lang==='fr'?'Accompagnements':'Sides'}</h3>
          <ul><li>{lang==='fr'?'Riz':'Rice'}</li><li>Aloco</li><li>{lang==='fr'?'Légumes sautés':'Sautéed vegetables'}</li><li>{lang==='fr'?'Pommes frites':'French fries'}</li><li>{lang==='fr'?'Pommes sautées':'Sautéed potatoes'}</li><li>{lang==='fr'?'Igname':'Yam'}</li><li>{lang==='fr'?'Patates douces':'Sweet potatoes'}</li></ul>
        </div>
        <div className="restaurant-v9-menu-group restaurant-v9-menu-drinks">
          <h3>{lang==='fr'?'Boissons':'Drinks'}</h3>
          <p>{lang==='fr'?'Plusieurs boissons fraîches disponibles.':'A selection of chilled drinks is available.'}</p>
        </div>
        <div className="restaurant-v9-footer">
          <p>{lang==='fr'?'Pour faciliter la préparation de votre repas, nous vous recommandons de confirmer votre commande avant votre arrivée.':'For a smoother dining experience, we recommend confirming your order before you arrive.'}</p>
          <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20me%20renseigner%20sur%20le%20restaurant%20Aquamazone." target="_blank" rel="noopener noreferrer">{lang==='fr'?'Contacter le restaurant':'Contact the restaurant'} <ArrowUpRight size={18}/></a>
        </div>
      </div>
    </div>
  </div>
</section>
<ImmersiveGallery lang={lang}/>
 <section id="location" className="location-v11" aria-labelledby="location-title">
  <div className="location-v11-shell">
    <div className="location-v11-heading">
      <p className="location-v11-kicker">06 / {lang==='fr'?'NOUS TROUVER':'FIND US'}</p>
      <h2 id="location-title">{lang==='fr'?<>Au bout de la Route des Pêches, <em>le lac vous attend.</em></>:<>At the end of the Coastal Road, <em>the lake awaits.</em></>}</h2>
      <p>{lang==='fr'?'Retrouvez AQUAMAZONE ADVENTURE au Village Adounko, à Cotonou.':'Find AQUAMAZONE ADVENTURE in Adounko Village, Cotonou.'}</p>
    </div>
    <div className="location-v11-layout">
      <div className="location-v11-map">
        <iframe title={lang==='fr'?'Carte de Togbin Plage, Bénin — zone de localisation d’Aquamazone':'Map of Togbin Plage, Benin — Aquamazone location area'} src="https://www.google.com/maps?q=Togbin+Plage,+Benin&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
        <a className="location-v11-map-link" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer"><MapPin size={17}/>{lang==='fr'?'Ouvrir dans Google Maps':'Open in Google Maps'}<ArrowUpRight size={17}/></a>
      </div>
      <div className="location-v11-directions">
        <div className="location-v11-address"><span>{lang==='fr'?'NOTRE ADRESSE':'OUR ADDRESS'}</span><strong>Village Adounko<br/>Route des Pêches<br/>Cotonou, Bénin</strong></div>
        <div className="location-v11-route">
          <div className="location-v11-route-head"><span>{lang==='fr'?'ITINÉRAIRE DEPUIS COTONOU':'DIRECTIONS FROM COTONOU'}</span><span>06 {lang==='fr'?'ÉTAPES':'STEPS'}</span></div>
          <ol>
            <li>{lang==='fr'?'Sur la Route des Pêches, après le Carrefour Club des Rois, continuez tout droit jusqu’au grand Carrefour Togbin Plage.':'Follow the Route des Pêches past Carrefour Club des Rois, continuing to the large Togbin Plage junction.'}</li>
            <li>{lang==='fr'?'Passez la station-service JBP.':'Pass the JBP service station.'}</li>
            <li>{lang==='fr'?'Continuez jusqu’à la prochaine intersection.':'Continue to the next intersection.'}</li>
            <li>{lang==='fr'?'Suivez les panneaux AQUAMAZONE.':'Follow the AQUAMAZONE signs.'}</li>
            <li>{lang==='fr'?'Tournez à droite et continuez jusqu’au lac.':'Turn right and continue towards the lake.'}</li>
            <li>{lang==='fr'?'Vous arriverez directement à notre embarcadère.':'You will arrive directly at our landing.'}</li>
          </ol>
        </div>
        <a className="location-v11-directions-cta" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer">{lang==='fr'?'Préparer mon itinéraire':'Get directions'}<ArrowUpRight size={19}/></a>
      </div>
    </div>
  </div>
</section>

<section id="visit" className="visit-v12" aria-labelledby="visit-title">
  <div className="visit-v12-shell">
    <div className="visit-v12-lead">
      <p className="visit-v12-eyebrow">07 / {lang==='fr'?'PRÉPARER VOTRE VISITE':'PLAN YOUR VISIT'}</p>
      <h2 id="visit-title">{lang==='fr'?<>Le bon moment <em>pour s’évader.</em></>:<>The perfect time <em>to get away.</em></>}</h2>
      <p className="visit-v12-intro">{lang==='fr'?'Les informations essentielles pour profiter pleinement de votre journée au bord de l’eau.':'Everything you need to know before spending your day by the water.'}</p>
    </div>
    <div className="visit-v12-grid">
      <div className="visit-v12-hours">
        <span className="visit-v12-overline">{lang==='fr'?'HORAIRES D’OUVERTURE':'OPENING HOURS'}</span>
        <div className="visit-v12-bigtime"><span>11<span className="visit-v12-unit">h</span></span><span className="visit-v12-dash" aria-hidden="true">—</span><span>18<span className="visit-v12-unit">h</span></span></div>
        <p className="visit-v12-days">{lang==='fr'?'Samedi · Dimanche · Jours fériés':'Saturday · Sunday · Public holidays'}</p>
        <p className="visit-v12-hours-note">{lang==='fr'?'Un week-end, un jour férié, une envie de prendre le large.':'Weekends, public holidays, and a chance to unwind.'}</p>
      </div>
      <div className="visit-v12-groups">
        <span className="visit-v12-overline">{lang==='fr'?'VISITES EN SEMAINE':'WEEKDAY VISITS'}</span>
        <div className="visit-v12-group-figure"><strong>06<span>+</span></strong><span>{lang==='fr'?'personnes':'people'}</span></div>
        <h3>{lang==='fr'?'L’aventure se partage.':'Better together.'}</h3>
        <p>{lang==='fr'?'En semaine, nous accueillons les groupes de 6 personnes minimum, sur réservation préalable. Une formule de 4 activités par personne est prévue.':'On weekdays, we welcome groups of at least 6 people with advance booking. A package of 4 activities per person applies.'}</p>
        <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20organiser%20une%20visite%20de%20groupe%20en%20semaine." target="_blank" rel="noopener noreferrer" className="visit-v12-link">{lang==='fr'?'Organiser une sortie en groupe':'Plan a group visit'}<ArrowUpRight size={18}/></a>
      </div>
    </div>
    <div className="visit-v12-practical">
      <div className="visit-v12-practical-heading"><span className="visit-v12-overline">{lang==='fr'?'BON À SAVOIR':'GOOD TO KNOW'}</span><h3>{lang==='fr'?'Avant de nous rejoindre':'Before you arrive'}</h3></div>
      <div className="visit-v12-practical-list">
        <div className="visit-v12-practical-item"><span className="visit-v12-num">01</span><div><h4>{lang==='fr'?'Traversée aller-retour':'Return boat crossing'}</h4><p>{lang==='fr'?'Adulte : 1 500 FCFA · Enfant de moins de 12 ans : 500 FCFA. La traversée est déjà incluse dans nos forfaits.':'Adult: 1,500 FCFA · Child under 12: 500 FCFA. The crossing is already included in our packages.'}</p></div></div>
        <div className="visit-v12-practical-item"><span className="visit-v12-num">02</span><div><h4>{lang==='fr'?'Restaurant & Bar':'Restaurant & Bar'}</h4><p>{lang==='fr'?'Pensez à confirmer votre commande avant votre arrivée afin de faciliter votre accueil.':'Please confirm your food order before arriving so we can better prepare for your visit.'}</p></div></div>
        <div className="visit-v12-practical-item"><span className="visit-v12-num">03</span><div><h4>{lang==='fr'?'Une question avant de venir ?':'Any questions before your visit?'}</h4><p>{lang==='fr'?'Notre équipe vous renseigne sur les activités, les forfaits et l’organisation de votre journée.':'Our team can help with activities, packages, and planning your day.'}</p></div></div>
      </div>
    </div>
    <div className="visit-v12-bottom">
      <div><span>{lang==='fr'?'BESOIN D’UN RENSEIGNEMENT ?':'NEED MORE INFORMATION?'}</span><strong>+229 01 54 28 44 44</strong></div>
      <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20des%20informations%20pour%20ma%20visite%20%C3%A0%20Aquamazone." target="_blank" rel="noopener noreferrer">{lang==='fr'?'Nous écrire sur WhatsApp':'Message us on WhatsApp'}<ArrowUpRight size={19}/></a>
    </div>
  </div>
</section>

<section id="faq" className="faq-v13" aria-labelledby="faq-title">
 <div className="faq-v13-shell">
  <div className="faq-v13-intro">
   <p className="faq-v13-eyebrow">08 / {lang==='fr'?'QUESTIONS FRÉQUENTES':'FREQUENTLY ASKED QUESTIONS'}</p>
   <h2 id="faq-title">{lang==='fr'?<>Tout savoir <em>avant de venir.</em></>:<>Everything to know <em>before you visit.</em></>}</h2>
   <p>{lang==='fr'?'Les réponses essentielles pour organiser votre expérience au bord de l’eau, en toute simplicité.':'The essentials for planning your day by the water, without the guesswork.'}</p>
   <div className="faq-v13-contact">
    <span>{lang==='fr'?'UNE AUTRE QUESTION ?':'SOMETHING ELSE?'}</span>
    <a href="https://wa.me/2290154284444?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20Aquamazone%20Adventure." target="_blank" rel="noopener noreferrer">{lang==='fr'?'Parlons sur WhatsApp':'Chat on WhatsApp'}<ArrowUpRight size={18} aria-hidden="true"/></a>
   </div>
  </div>
  <div className="faq-v13-questions">
   {faqItems.map((item,i)=><details className="faq-v13-item" key={i} name="aquamazone-faq" >
    <summary><span className="faq-v13-index">{String(i+1).padStart(2,'0')}</span><span className="faq-v13-question">{item.q[lang]}</span><span className="faq-v13-toggle" aria-hidden="true"><Plus size={19}/></span></summary>
    <div className="faq-v13-answer"><p>{item.a[lang]}</p></div>
   </details>)}
   <p className="faq-v13-footnote">{lang==='fr'?'Pour les détails particuliers à votre sortie, contactez directement notre équipe.':'For details specific to your visit, please contact our team directly.'}</p>
  </div>
 </div>
</section>
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
