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
      <p className="kicker">{lang==='fr'?'RESTAURANT & BAR':'RESTAURANT & BAR'} <span aria-hidden="true">/ 04</span></p>
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
