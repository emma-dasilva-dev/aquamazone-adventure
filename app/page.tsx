'use client';
import {useEffect,useState} from 'react';
import {publicText} from '../lib/public-i18n';
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
 es:{nav:['Actividades','Paquetes','Restaurante','Galería','Ubicación'],book:'Reservar',hero:'Relájate junto al agua.',explore:'Explorar actividades',eyebrow:'TU PRÓXIMA ESCAPADA',intro:'La aventura comienza aquí.',desc:'Actividades acuáticas, momentos para compartir y naturaleza por descubrir.',activity:'Elige tu aventura',activitySub:'Descubre las actividades, precios y fotos de Aquamazone.',featured:'DESCUBRIR',packages:'Nuestros paquetes',food:'Una pausa deliciosa junto al agua',gallery:'Recuerdos por vivir',location:'Cómo llegar',hours:'Sábados, domingos y festivos · De 11 a. m. a 6 p. m.',cta:'Planificar mi visita',placeholder:'Foto de Aquamazone',ask:'¿Una pregunta?',chat:'Asistente Aquamazone',chatWelcome:'¡Hola! Puedo ayudarte con horarios, precios y ubicación.',chatQuestions:['¿Cuál es el horario?','¿Dónde están?','¿Cuánto cuesta el pedaló?'],close:'Cerrar',menu:'Abrir menú'},
 hi:{nav:['गतिविधियाँ','पैकेज','रेस्तराँ','गैलरी','स्थान'],book:'बुक करें',hero:'पानी के किनारे सुकून।',explore:'गतिविधियाँ देखें',eyebrow:'आपकी अगली सैर',intro:'रोमांच यहाँ शुरू होता है।',desc:'पानी की गतिविधियाँ, साथ बिताए पल और प्रकृति का आनंद।',activity:'अपनी गतिविधि चुनें',activitySub:'Aquamazone की गतिविधियाँ, कीमतें और तस्वीरें देखें।',featured:'देखें',packages:'हमारे पैकेज',food:'पानी के किनारे स्वादिष्ट भोजन',gallery:'यादगार पल',location:'हम तक कैसे पहुँचें',hours:'शनिवार, रविवार और सार्वजनिक अवकाश · सुबह 11 बजे से शाम 6 बजे तक',cta:'यात्रा की योजना बनाएँ',placeholder:'Aquamazone की तस्वीर',ask:'कोई सवाल?',chat:'Aquamazone सहायक',chatWelcome:'नमस्ते! समय, कीमत और स्थान की जानकारी उपलब्ध है।',chatQuestions:['खुलने का समय?','आप कहाँ हैं?','पेडलो की कीमत?'],close:'बंद करें',menu:'मेनू खोलें'},
 fon:{nav:['Activités','Forfaits','Restaurant','Fɔtó','Localisation'],book:'Réserver',hero:'La détente au fil de l’eau.',explore:'NǓ WÁN WÁN',eyebrow:'AQUAMAZONE ADVENTURE',intro:'L’aventure commence ici.',desc:'Activités nautiques, détente et découvertes naturelles à Adounko.',activity:'Choisissez votre aventure',activitySub:'Activités, tarifs et photos à Aquamazone.',featured:'À DÉCOUVRIR',packages:'Nos forfaits',food:'Restaurant & Bar',gallery:'Galerie',location:'Comment nous trouver',hours:'Samedi, dimanche et jours fériés · 11h–18h',cta:'Préparer ma visite',placeholder:'Photo Aquamazone',ask:'Une question ?',chat:'Assistant Aquamazone',chatWelcome:'Bonjour ! Notre équipe peut vous aider.',chatQuestions:['Horaires ?','Localisation ?','Tarifs ?'],close:'Fermer',menu:'Ouvrir le menu'}
};
const allCopy={...copy,...extraCopy};
const sections=['activities','packages','restaurant','gallery','location'];

const faqItems=[
 {q:{fr:'Quels sont vos jours et horaires d’ouverture ?',en:'When are you open?'},a:{fr:'Nous sommes ouverts les samedis, dimanches et jours fériés, de 11h à 18h.',en:'We are open on Saturdays, Sundays and public holidays, from 11am to 6pm.'},esQ:"¿Cuándo abren?",esA:"Abrimos sábados, domingos y festivos, de 11:00 a 18:00.",hiQ:"आप कब खुले रहते हैं?",hiA:"हम शनिवार, रविवार और सार्वजनिक छुट्टियों में सुबह 11 बजे से शाम 6 बजे तक खुले रहते हैं।"},
 {q:{fr:'Peut-on venir en semaine ?',en:'Can we visit during the week?'},a:{fr:'Oui, les visites en semaine sont possibles pour les groupes de 6 personnes minimum, sur réservation préalable, avec une formule de 4 activités par personne. Contactez-nous sur WhatsApp pour organiser votre sortie.',en:'Yes. Weekday visits are available for groups of at least 6 people by advance reservation, with a package of 4 activities per person. Contact us on WhatsApp to arrange your visit.'},esQ:"¿Se puede visitar entre semana?",esA:"Sí, para grupos de al menos 6 personas, con reserva previa y una fórmula de 4 actividades por persona. Escríbenos por WhatsApp para organizar la visita.",hiQ:"क्या सप्ताह के दिनों में आ सकते हैं?",hiA:"हाँ, कम से कम 6 लोगों के समूह पहले से आरक्षण करके आ सकते हैं। प्रति व्यक्ति 4 गतिविधियों वाला पैकेज उपलब्ध है। व्यवस्था के लिए WhatsApp पर संपर्क करें।"},
 {q:{fr:'Où se trouve AQUAMAZONE ADVENTURE ?',en:'Where is AQUAMAZONE ADVENTURE located?'},a:{fr:'Au Village Adounko, sur la Route des Pêches à Cotonou, au Bénin. Depuis le Carrefour Club des Rois, continuez vers le grand Carrefour Togbin Plage, passez la station JBP puis suivez les panneaux AQUAMAZONE vers le lac et l’embarcadère.',en:'In Adounko Village on the Route des Pêches in Cotonou, Benin. From Carrefour Club des Rois, continue towards the large Togbin Plage junction, pass the JBP station, then follow the AQUAMAZONE signs towards the lake and landing.'},esQ:"¿Dónde está AQUAMAZONE ADVENTURE?",esA:"Estamos en Adounko Village, Route des Pêches, Cotonú, Benín. Desde Carrefour Club des Rois, sigue hacia el cruce de Togbin Plage, pasa la estación JBP y sigue los carteles de AQUAMAZONE hacia el lago y el embarcadero.",hiQ:"AQUAMAZONE ADVENTURE कहाँ है?",hiA:"हम अदुनको गाँव, Route des Pêches, कोटोनू, बेनिन में हैं। Carrefour Club des Rois से Togbin Plage चौराहे की ओर जाएँ, JBP स्टेशन पार करें और झील व नाव घाट की ओर AQUAMAZONE के संकेतों का पालन करें।"},
 {q:{fr:'La traversée en pirogue est-elle payante ?',en:'Is the return boat crossing charged separately?'},a:{fr:'La traversée en pirogue aller-retour est obligatoire pour accéder à la base. Tarif : 1 500 FCFA par adulte et par personne dès 12 ans ; 500 FCFA par enfant de moins de 12 ans. Elle est déjà incluse dans les forfaits, sans double facturation.',en:'The return pirogue crossing is mandatory to reach the base. The price is 1,500 FCFA for adults and ages 12+, and 500 FCFA for children under 12. Packages already include it, so you are not charged twice.'},esQ:"¿Se paga aparte el traslado en piragua?",esA:"La travesía obligatoria de ida y vuelta cuesta 1.500 FCFA por persona de 12 años o más y 500 FCFA por menor de 12. Ya está incluida en los paquetes, sin cobro doble.",hiQ:"क्या आने-जाने की नाव यात्रा का अलग शुल्क है?",hiA:"केंद्र तक पहुँचने के लिए आने-जाने की नाव यात्रा ज़रूरी है। 12 वर्ष या उससे अधिक उम्र के लिए 1,500 FCFA और 12 वर्ष से कम बच्चों के लिए 500 FCFA। पैकेज में यह पहले से शामिल है, इसलिए दोबारा शुल्क नहीं लगता।"},
 {q:{fr:'Quelles activités peut-on faire sur place ?',en:'What activities are available?'},a:{fr:'Nous proposons notamment le pédalo, le canoë-kayak, le paddle, le bateau à pédales, la bulle gonflable, ainsi que la balade sur le lac / visite des mangroves. Le jet-ski est actuellement indisponible pour maintenance.',en:'Our experiences include pedal boats, canoeing and kayaking, stand-up paddle, pedal-powered boats, inflatable water balls, a lake tour / mangrove visit. Jet skiing is currently unavailable due to maintenance.'},esQ:"¿Qué actividades ofrecen?",esA:"Ofrecemos pedaló, canoa-kayak, paddle surf, barco a pedales, bola inflable, paseo por el lago y visita a los manglares. Las motos acuáticas no están disponibles actualmente por mantenimiento.",hiQ:"कौन-कौन सी गतिविधियाँ उपलब्ध हैं?",hiA:"पेडलो, कैनो-कायक, स्टैंड-अप पैडल, पैडल बोट, पानी में चलने वाली फुलाने योग्य बॉल, झील की सैर और मैंग्रोव भ्रमण उपलब्ध हैं। जेट स्की अभी रखरखाव के कारण उपलब्ध नहीं है।"},
 {q:{fr:'Comment choisir un forfait sans confusion ?',en:'How do I know exactly what a package includes?'},a:{fr:'Chaque forfait indique le nombre de participants, son tarif et les activités incluses. Pour le forfait découverte GLÈLÈ, choisissez une seule activité : canoë-kayak simple OU pédalo simple OU paddle/stand-up (30 min). La traversée est incluse. Pour toute précision sur un autre forfait, contactez notre équipe.',en:'Each package states the number of guests, the price and the included activities. The GLÈLÈ discovery package includes ONE 30-minute activity: a single canoe-kayak OR a single pedalo OR stand-up paddle. The crossing is included. Contact our team to confirm details of other packages.'},esQ:"¿Cómo sé qué incluye un paquete?",esA:"Cada paquete indica participantes, precio y actividades incluidas. GLÈLÈ incluye UNA actividad de 30 minutos: canoa-kayak individual O pedaló individual O paddle surf. La travesía está incluida. Consulta otros paquetes con nuestro equipo.",hiQ:"पैकेज में क्या शामिल है, यह कैसे जानें?",hiA:"हर पैकेज में लोगों की संख्या, कीमत और शामिल गतिविधियाँ दी गई हैं। GLÈLÈ में 30 मिनट की केवल एक गतिविधि शामिल है: सिंगल कैनो-कायक या सिंगल पेडलो या स्टैंड-अप पैडल। नाव यात्रा शामिल है। अन्य पैकेजों की जानकारी के लिए टीम से संपर्क करें।"},
 {q:{fr:'Peut-on manger au restaurant ?',en:'Is food available at the restaurant?'},a:{fr:'Oui, notre Restaurant & Bar propose notamment des poissons braisés, des brochettes de poulet, des accompagnements et des boissons fraîches. Nous vous recommandons de confirmer votre commande avant votre arrivée.',en:'Yes. Our Restaurant & Bar offers grilled fish, chicken skewers, sides and cold drinks. We recommend confirming your order before you arrive.'},esQ:"¿Hay comida en el restaurante?",esA:"Sí. Nuestro restaurante y bar ofrece pescado a la parrilla, brochetas de pollo, guarniciones y bebidas frías. Recomendamos confirmar el pedido antes de llegar.",hiQ:"क्या रेस्तराँ में खाना मिलता है?",hiA:"हाँ। रेस्तराँ और बार में ग्रिल्ड मछली, चिकन सीख, साथ में परोसे जाने वाले व्यंजन और ठंडे पेय मिलते हैं। आने से पहले ऑर्डर की पुष्टि करना बेहतर है।"},
 {q:{fr:'Comment réserver ou poser une question ?',en:'How can I book or ask a question?'},a:{fr:'Les demandes pour le week-end ouvrent chaque lundi. Pour une visite samedi, envoyez votre demande au plus tard vendredi à 23h59 ; pour dimanche, au plus tard samedi à 23h59 (heure du Bénin). Le dimanche, les nouvelles demandes en ligne sont closes. Toute visite en semaine doit être organisée à l’avance avec notre équipe sur WhatsApp au +229 01 54 28 44 44. Le paiement en ligne et la confirmation automatique ne sont pas encore actifs.',en:'Weekend enquiries open every Monday. For Saturday visits, request by Friday 11:59pm; for Sunday visits, by Saturday 11:59pm (Benin time). New online enquiries are closed on Sunday. Weekday visits must be arranged in advance with our team on WhatsApp at +229 01 54 28 44 44. Online payment and automatic confirmation are not active yet.'},esQ:"¿Cómo reservo o hago una consulta?",esA:"Las solicitudes para el fin de semana abren cada lunes. Para el sábado, envía la solicitud antes del viernes a las 23:59; para el domingo, antes del sábado a las 23:59 (hora de Benín). Las visitas entre semana se organizan por WhatsApp al +229 01 54 28 44 44. No hay pago en línea ni confirmación automática.",hiQ:"बुकिंग या सवाल कैसे पूछें?",hiA:"सप्ताहांत के अनुरोध हर सोमवार खुलते हैं। शनिवार की यात्रा के लिए शुक्रवार रात 11:59 बजे तक और रविवार की यात्रा के लिए शनिवार रात 11:59 बजे तक (बेनिन समय) अनुरोध भेजें। सप्ताह के दिनों की यात्रा के लिए +229 01 54 28 44 44 पर WhatsApp करें। ऑनलाइन भुगतान या स्वतः बुकिंग पुष्टि उपलब्ध नहीं है।"}
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
 const tx=(en:string,fr:string)=>publicText(lang,en,fr);
 const tandem=kind.endsWith('-double');
 const pedalo=kind.startsWith('pedalo');
 const people=tandem?2:1;
 return <div className="az-craft-visual" aria-label={(tx("Illustrative diagram: ","Schéma illustratif : "))+(pedalo?'pédalo':'canoë-kayak')+' · '+people+(tx(" person(s)"," personne(s)"))}>
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
 const [lang,setLang]=useState<Lang>('fr');const [languageOpen,setLanguageOpen]=useState(false);const [menu,setMenu]=useState(false);const [preview,setPreview]=useState<string|null>(null);const [reservationIntent,setReservationIntent]=useState<{activity:string;version:number}|null>(null);const t=allCopy[lang];const tx=(en:string,fr:string)=>publicText(lang,en,fr);const contentLang=lang==='en'?'en':'fr';
 useEffect(()=>{try{const saved=localStorage.getItem('aquamazone-language');if(saved&&languageOptions.some(l=>l.code===saved))setLang(saved as Lang)}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=lang==='fon'?'fon':lang;try{localStorage.setItem('aquamazone-language',lang)}catch{}},[lang]);
 useEffect(()=>{document.body.style.overflow=menu||preview?'hidden':'';return()=>{document.body.style.overflow='';};},[menu,preview]);
 useEffect(()=>{if(!preview)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setPreview(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[preview]);

 return <>
 <header className="site-header"><a className="wordmark wordmark-logo" href="#top" aria-label="Aquamazone Adventure — accueil"><img src="/images/aquamazone-logo.png" alt="Aquamazone Adventure" width="2048" height="682" /></a><nav className="desktop-nav" aria-label={tx("Main navigation","Navigation principale")}>{sections.map((section,i)=><a href={'#'+section} key={section}>{t.nav[i]}</a>)}</nav><div className="header-actions"><div className="language-picker"><button className="lang language-trigger" type="button" aria-label="Choisir la langue / Select language" aria-haspopup="listbox" aria-expanded={languageOpen} onClick={()=>setLanguageOpen(!languageOpen)}><Globe2 size={19} aria-hidden="true"/><span>{lang.toUpperCase()}</span><ChevronDown size={13} aria-hidden="true"/></button>{languageOpen&&<><button className="language-dismiss" aria-label="Fermer le choix de langue" onClick={()=>setLanguageOpen(false)}/><div className="language-options" role="listbox" aria-label="Langue du site">{languageOptions.map(option=><button type="button" role="option" aria-selected={lang===option.code} key={option.code} onClick={()=>{setLang(option.code);setLanguageOpen(false)}}><span>{option.label}</span><small>{option.code.toUpperCase()}</small></button>)}</div></>}</div><a className="header-book" href="#reservation">{t.book} <ArrowUpRight size={17}/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu?t.close:t.menu}>{menu?<X/>:<Menu/>}</button></div></header>
 {menu&&<nav id="mobile-menu" className="mobile-nav" aria-label={tx("Mobile navigation","Navigation mobile")}>{sections.map((s,i)=><a onClick={()=>setMenu(false)} href={'#'+s} key={s}><span>0{i+1}</span>{t.nav[i]}<ArrowUpRight size={20}/></a>)}<a href="#reservation" onClick={()=>setMenu(false)}>{t.book}<ArrowRight/></a></nav>}
 <main id="top">
 <section className="hero hero-v3" aria-labelledby="hero-title">
 <div className="hero-photography" role="img" aria-label={tx("Photograph of the Aquamazone waterfront base","Photographie de la base nautique Aquamazone")}/>
 <div className="hero-shade" aria-hidden="true"/>
 <div className="hero-v3-content">
  <p className="hero-v3-kicker">{lang==='es'?'ACTIVIDADES ACUÁTICAS':lang==='hi'?'जल गतिविधियाँ':lang==='en'?'WATERFRONT ADVENTURE':'BASE DE LOISIRS NAUTIQUES'}</p>
  <h1 id="hero-title">{lang==='es'?<>Descansa <em>junto al agua.</em></>:lang==='hi'?<>पानी के किनारे <em>सुकून।</em></>:lang==='en'?<>Relaxation <em>by the water.</em></>:<>La détente <em>au fil de l’eau.</em></>}</h1>
  <p className="hero-v3-description">{lang==='es'?'Actividades acuáticas, descanso y naturaleza en Adounko, Cotonú.':lang==='hi'?'अदुनको, कोटोनू में जल गतिविधियाँ, आराम और प्रकृति का आनंद।':lang==='en'?'Water activities, relaxation and nature discovery in Adounko, Cotonou.':'Activités nautiques, détente et découvertes naturelles à Adounko, Cotonou.'}</p>
  <div className="hero-v3-actions"><a className="yellow-button" href="#reservation">{lang==='es'?'Solicitar reserva':lang==='hi'?'बुकिंग का अनुरोध करें':lang==='en'?'Request a booking':'Demander une réservation'}<ArrowUpRight size={18}/></a><a className="hero-secondary" href="#activities">{t.explore}<ArrowDown size={17}/></a></div>
 </div>
 <div className="az-hero-info" aria-label={tx("Visitor information","Informations pratiques")}>
  <span><MapPin size={13} aria-hidden="true"/>{tx("Adounko Village, Route des Pêches, Cotonou","Adounko Village, Route des Pêches, Cotonou")}</span>
  <span><Clock size={13} aria-hidden="true"/>{lang==='es'?'Abierto sáb. / dom. y festivos, de 11 a. m. a 6 p. m.':lang==='hi'?'शनिवार / रविवार और छुट्टियों में खुला, सुबह 11 बजे से शाम 6 बजे तक':lang==='en'?'Open Sat / Sun & public holidays, 11am – 6pm':'Ouverts Sam / Dim et jours fériés, 11h – 18h'}</span>
  <span><UtensilsCrossed size={14} aria-hidden="true"/>{tx("Bar & Restaurant","Bar & Restaurant")}</span>
 </div>
 <span className="image-disclosure">{tx("Photographed at Aquamazone","Photographie prise à Aquamazone")}</span>
 </section>
 <section className="az-crossing-first" aria-labelledby="az-crossing-title">
   <div className="az-crossing-first-inner">
     <div className="az-crossing-first-copy">
       <p className="kicker">{tx("BEFORE THE ACTIVITIES","AVANT LES ACTIVITÉS")}</p>
       <h2 id="az-crossing-title">{tx("Mandatory return pirogue crossing","Traversée en pirogue aller-retour obligatoire")}</h2>
       <p>{tx("Every visitor takes the return pirogue crossing to reach our waterside base. All packages already include this crossing, so there is no additional charge.","Pour rejoindre notre base nautique, chaque visiteur effectue la traversée aller-retour. Elle est déjà incluse dans tous nos forfaits : aucun supplément à payer.")}</p>
     </div>
     <div className="az-crossing-first-prices">
       <div><span>{tx("Adults and ages 12+","Adulte et 12 ans +")}</span><strong>1 500 <small>FCFA</small></strong></div>
       <div><span>{tx("Children under 12","Enfant de moins de 12 ans")}</span><strong>500 <small>FCFA</small></strong></div>
     </div>
   </div>
 </section>
 <section id="activities" className="activities activities-v3 section-shell">
 <div className="activity-v3-heading"><div><p className="kicker">{tx("02 / OUR ACTIVITIES","02 / NOS ACTIVITÉS")}</p><h2>{tx("Unforgettable moments on the water","Des expériences uniques sur l’eau")}</h2></div><p>{tx("Pedal boats, kayaks, paddleboards and more. Find your kind of adventure.","Pédalo, kayak, paddle et bien plus encore. Trouvez l’expérience qui vous ressemble.")}</p></div>
 
 <div className="activity-vertical-list">
 {activities.map((a,i)=><article className="activity-list-item" key={a.id}>
   <span className="activity-list-index">{String(i+1).padStart(2,'0')}</span>
   <div className="activity-list-copy">
     <h3>{lang!=='en'?a.fr:a.en}</h3>
     <div className="activity-list-facts">{a.duration&&<span>{a.duration}</span>}{a.duration&&a.price&&<span aria-hidden="true">·</span>}{a.price&&<strong>{a.price}</strong>}</div>
     {a.note&&<p className={a.unavailable?'activity-list-alert':'activity-list-note'}>{lang==='fr'?a.note:tx(a.noteEn??a.note,a.note)}</p>}
     {!a.unavailable&&<a className="activity-list-link" href={a.id==='rental'?bookingWhatsApp:'#reservation'}
       target={a.id==='rental'?'_blank':undefined} rel={a.id==='rental'?'noopener noreferrer':undefined}
       onClick={()=>{if(a.id!=='rental'){
         const selectedActivity=a.id.startsWith('pedalo-')?'pedalo':a.id.startsWith('canoe-')?'canoe':
           ({boat:'pedalboat',ball:'waterball',tour:'lake'} as Record<string,string>)[a.id]??a.id;
         setReservationIntent(old=>({activity:selectedActivity,version:(old?.version??0)+1}));
       }}}>
       {tx("Request a booking","Demander une réservation")}<ArrowUpRight size={15}/>
     </a>}
   </div>
   {activityVisuals[a.id]?
     <button className="activity-thumbnail" type="button" onClick={()=>setPreview(a.id)} aria-label={(tx("Expand photo: ","Agrandir la photo : "))+(lang!=='en'?a.fr:a.en)}>
       <span className="activity-thumbnail-photo" style={{backgroundImage:`url("${activityVisuals[a.id]}")`}} aria-hidden="true"/>
       <span className="activity-thumbnail-zoom" aria-hidden="true"><ZoomIn size={17}/></span>
     </button>:
     <span className="activity-no-photo">{tx("Photo pending","Photo à venir")}</span>}
 </article>)}
 </div>
  <p className="prototype-notice">{tx("Online booking and payment are in development. For now, request bookings via WhatsApp.","Réservation et paiement en ligne en cours de développement. Pour le moment, demandez votre réservation sur WhatsApp.")}</p>
 </section>
 <section id="packages" className="packages packages-v4" aria-labelledby="packages-title">
 <div className="section-shell">
   <div className="packages-v4-heading">
     <div><p className="kicker">{tx("03 / OUR PACKAGES","03 / NOS FORFAITS")}</p><h2 id="packages-title">{lang==='es'?<>La experiencia <em>a tu manera.</em></>:lang==='hi'?<>आपका अनुभव <em>आपके अंदाज़ में।</em></>:lang==='en'?<>Your kind of <em>adventure.</em></>:<>L’expérience <em>à votre façon.</em></>}</h2></div>
     <p>{tx("Solo, as a couple, with family or friends: find the right way to enjoy the lake.","Seul, à deux, en famille ou entre amis : choisissez votre façon de profiter du lac.")}</p>
   </div>
   <div className="packages-v4-featured packages-v6-featured">
     <article className="package-experience package-experience-solo">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">01 <span>{tx("PACKAGE","FORFAIT")}</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>01 / 04</span><span>{tx("DISCOVERY · PER PERSON","DÉCOUVERTE · PAR PERSONNE")}</span></div>
         <p className="package-experience-eyebrow">{tx("Your first adventure","Le plaisir de découvrir")}</p>
         <h3>GLÈLÈ</h3>
         <p className="package-experience-intro">{tx("A discovery experience for adults and accompanied children.","Une découverte pour les adultes et les enfants accompagnés.")}</p>
         <div className="package-experience-included">
            <strong>{tx("Included in this package:","Ce forfait comprend :")}</strong>
            <ul>
              <li>{tx("Return pirogue crossing","Traversée en pirogue aller-retour")}</li>
              <li>{tx("ONE activity per person: single canoe-kayak OR single pedalo OR stand-up paddle (30 min)","1 activité par personne au choix : canoë-kayak simple OU pédalo simple OU paddle/stand-up (30 min)")}</li>
            </ul>
          </div>
         <p className="az-glele-safety">{lang==='fr'
           ?'Enfants de moins de 12 ans : accompagnement par un adulte obligatoire. L’accès aux activités dépend de leur capacité à manœuvrer en sécurité et de l’accord de l’équipe.'
           :'Children under 12 must be accompanied by an adult. Activity access depends on their ability to operate the equipment safely and staff approval.'}</p>
         <div className="package-experience-end">
           <div className="package-v6-prices"><span>{tx("Adult","Adulte")} <strong>5 000 <small>FCFA</small></strong></span><span>{tx("Child","Enfant")} <strong>3 500 <small>FCFA</small></strong></span></div>
           <a href="#reservation" aria-label={tx("Enquire about GLÈLÈ","Se renseigner sur le forfait GLÈLÈ")}>{tx("Choose GLÈLÈ","Choisir GLÈLÈ")}<ArrowUpRight size={18}/></a>
         </div>
       </div>
     </article>
     <article className="package-experience package-experience-couple">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">02 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>02 / 04</span><span>{tx("COUPLE · 2 PEOPLE","COUPLE · 2 PERSONNES")}</span></div>
         <p className="package-experience-eyebrow">{tx("Make memories together","Deux fois plus de souvenirs")}</p>
         <h3>GUÉZO</h3>
         <p className="package-experience-intro">{tx("An adventure made for two.","Une aventure à partager, ensemble.")}</p>
         <div className="package-experience-included">
            <strong>{tx("Included in this package:","Ce forfait comprend :")}</strong>
            <ul>
              <li>{tx("Return pirogue crossing","Traversée en pirogue aller-retour")}</li>
              <li>{tx("Double canoe-kayak","Canoë-kayak double")}</li>
              <li>{tx("Double pedalo","Pédalo double")}</li>
              <li>{tx("Complimentary juice","Jus offert")}</li>
            </ul>
          </div>
         <div className="package-experience-end"><div><span className="package-experience-small">{tx("Per couple","Pour le couple")}</span><strong>12 000 <small>FCFA</small></strong></div><a href="#reservation" aria-label={tx("Enquire about GUÉZO","Se renseigner sur le forfait GUÉZO")}>{tx("Choose GUÉZO","Choisir GUÉZO")}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
   </div>
   <div className="packages-v5-extras" aria-label={tx("Family and group packages","Forfaits famille et groupe")}>
     <article className="package-experience package-experience-family">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">04 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>03 / 04</span><span>{tx("FAMILY · 2 ADULTS + 2 CHILDREN","FAMILLE · 2 ADULTES + 2 ENFANTS")}</span></div>
         <p className="package-experience-eyebrow">{tx("Make memories together","Des souvenirs ensemble")}</p>
         <h3>TOFFA</h3>
         <p className="package-experience-intro">{tx("A family day out, enjoyed at your own pace.","Une journée à partager en famille, au rythme de l’eau.")}</p>
         <div className="package-experience-included">
            <strong>{tx("Included in this package:","Ce forfait comprend :")}</strong>
            <ul>
              <li>{tx("Return pirogue crossing","Traversée en pirogue aller-retour")}</li>
              <li>{tx("Family pedal-powered boat (4 people)","Bateau à pédales familial (4 personnes)")}</li>
              <li>{tx("Complimentary juice","Jus offert")}</li>
            </ul>
          </div>
         <div className="package-experience-end"><div><span className="package-experience-small">{tx("For 2 adults + 2 children","Pour 2 adultes + 2 enfants")}</span><strong>18 000 <small>FCFA</small></strong></div><a href="#reservation">{tx("Choose TOFFA","Choisir TOFFA")}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
     <article className="package-experience package-experience-group">
       <div className="package-experience-art" aria-hidden="true"><span className="package-art-sun"/><span className="package-art-wave package-art-wave-one"/><span className="package-art-wave package-art-wave-two"/><span className="package-art-label">04 <span>PERSONNES</span></span></div>
       <div className="package-experience-body">
         <div className="package-experience-top"><span>04 / 04</span><span>{tx("GROUP · 4 ADULTS","GROUPE · 4 ADULTES")}</span></div>
         <p className="package-experience-eyebrow">{tx("Adventure together","L’aventure à plusieurs")}</p>
         <h3>BÉHANZIN</h3>
         <p className="package-experience-intro">{tx("A complete water adventure with friends.","Une expérience complète à vivre entre amis.")}</p>
         <div className="package-experience-included">
            <strong>{tx("Included in this package:","Ce forfait comprend :")}</strong>
            <ul>
              <li>{tx("Return pirogue crossing","Traversée en pirogue aller-retour")}</li>
              <li>{tx("Double canoe-kayak","Canoë-kayak double")}</li>
              <li>{tx("Lake tour","Balade sur le lac")}</li>
              <li>{tx("Pedalo","Pédalo")}</li>
              <li>{tx("Complimentary juice","Jus offert")}</li>
            </ul>
          </div>
         <div className="package-experience-end"><div><span className="package-experience-small">{tx("For 4 adults","Pour 4 adultes")}</span><strong>36 000 <small>FCFA</small></strong></div><a href="#reservation">{tx("Choose BÉHANZIN","Choisir BÉHANZIN")}<ArrowUpRight size={18}/></a></div>
       </div>
     </article>
   </div>
   <p className="packages-v4-footnote">{tx("Crossings included in a package are not charged a second time. Bookings are currently handled via WhatsApp.","Les traversées déjà incluses dans un forfait ne sont pas facturées une seconde fois. Réservations actuellement prises en charge via WhatsApp.")}</p>
 </div>
 </section>
 <section id="restaurant" className="restaurant-v9" aria-labelledby="restaurant-title">
  <div className="restaurant-v9-shell">
    <div className="restaurant-v9-intro">
      <p className="kicker"><span aria-hidden="true">04 / </span>{tx("RESTAURANT & BAR","RESTAURANT & BAR")}</p>
      <h2 id="restaurant-title">{lang==='es'?<>Una pausa deliciosa <em>junto al agua.</em></>:lang==='hi'?<>स्वादिष्ट भोजन <em>पानी के किनारे।</em></>:lang==='en'?<>A delicious break <em>by the water.</em></>:<>Une pause gourmande <em>au bord de l’eau.</em></>}</h2>
      <p>{tx("After your activities, take time to enjoy a good meal in a peaceful waterfront setting.","Après les activités, prenez le temps de savourer un bon repas dans un cadre paisible au bord de l’eau.")}</p>
    </div>
    <div className="restaurant-v9-grid">
      <div className="restaurant-v9-visual">
        <div className="restaurant-v9-photo" role="img" aria-label={tx("Grilled fish served at Aquamazone","Poisson braisé servi à Aquamazone")}/>
        <div className="restaurant-v9-photo-caption"><span>{tx("A break by the water","Une pause au bord de l’eau")}</span><span>{tx("Grilled fish · Aquamazone","Poisson braisé · Aquamazone")}</span></div>
      </div>
      <div className="restaurant-v9-menu">
        <div className="restaurant-v9-menu-top"><span>{tx("ON THE MENU","À LA CARTE")}</span><span>ADOUNKO · BÉNIN</span></div>
        <div className="restaurant-v9-menu-group">
          <h3>{tx("From the grill","Nos grillades")}</h3>
          <ul className="restaurant-v9-fish-list">
            <li><span>{lang==='es'?<>Pescado (según disponibilidad)<small>Lubina y carpa a la parrilla</small></>:lang==='hi'?<>मछली (उपलब्धता के अनुसार)<small>ग्रिल्ड सी बास और कार्प</small></>:lang==='en'?<>Fish (subject to availability)<small>Grilled sea bass, carp</small></>:<>Poissons (selon arrivages)<small>Bar, carpe braisés</small></>}</span><strong>6 500 – 9 000 FCFA</strong></li>
            <li><span>{tx("Chicken skewers","Brochettes de poulet")}</span><strong>6 000 FCFA</strong></li>
          </ul>
          <p className="restaurant-v9-included">{lang==='fr'
            ?'Chaque grillade comprend un accompagnement au choix. Le prix du poisson varie selon le type et la taille.'
            :'Each grilled dish includes one side of your choice. Fish prices vary by type and size.'}</p>
        </div>
        <div className="restaurant-v9-menu-group">
          <h3>{tx("Other selections","Autres propositions")}</h3>
          <ul className="restaurant-v9-fish-list">
            <li><span>{tx("Gari Gnignan with scrambled eggs","Gari Gnignan + œufs brouillés")}</span><strong>3 000 FCFA</strong></li>
          </ul>
        </div>
        <div className="restaurant-v9-menu-group">
          <h3>{tx("Sides","Accompagnements")}</h3>
          <ul><li>{tx("Rice","Riz")}</li><li>Aloco</li><li>{tx("Sautéed vegetables","Légumes sautés")}</li><li>{tx("French fries","Pommes frites")}</li><li>{tx("Sautéed potatoes","Pommes sautées")}</li><li>{tx("Yam","Igname")}</li><li>{tx("Sweet potatoes","Patates douces")}</li></ul>
          <p className="restaurant-v9-extra">{tx("Additional side portion: ","Portion supplémentaire : ")}<strong>1 500 FCFA</strong></p>
        </div>
        <div className="restaurant-v9-menu-group restaurant-v9-menu-drinks">
          <h3>{tx("Drinks","Boissons")}</h3>
          <ul className="restaurant-v9-fish-list restaurant-v9-drink-prices">
            <li><span>{tx("Soft drinks","Sucreries")}</span><strong>1 000 – 1 500 FCFA</strong></li>
            <li><span>{tx("Cocktails","Cocktails")}</span><strong>3 000 FCFA</strong></li>
            <li><span>{tx("Wines","Vins")}</span><strong>9 000 – 15 000 FCFA</strong></li>
            <li><span>{tx("Champagne","Champagne")}</span><strong>50 000 FCFA</strong></li>
            <li><span>{tx("Beers","Bières")}</span><strong>1 500 – 2 000 FCFA</strong></li>
            <li><span>{tx("Water","Eaux")}</span><strong>500 – 1 500 FCFA</strong></li>
            <li><span>{tx("Spirits","Alcools")}</span><strong>1 000 – 3 000 FCFA</strong></li>
            <li><span>{tx("Hot tea (green tea / lemongrass)","Thé chaud (thé vert / citronnelle)")}</span><strong>1 500 FCFA</strong></li>
            <li><span>{tx("Coffee","Café")}</span><strong>1 500 FCFA</strong></li>
          </ul>
        </div>
        <div className="restaurant-v9-footer">
          <p>{tx("Advance food orders require full payment. Online food pre-orders are not yet enabled; contact us for the current arrangements.","Pour commander à l’avance, le paiement intégral est obligatoire. La précommande en ligne n’est pas encore activée : contactez-nous pour connaître les modalités.")}</p>
          <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20me%20renseigner%20sur%20le%20restaurant%20Aquamazone." target="_blank" rel="noopener noreferrer">{tx("Contact the restaurant","Contacter le restaurant")} <ArrowUpRight size={18}/></a>
        </div>
      </div>
    </div>
  </div>
</section>
<ImmersiveGallery lang={lang}/>
 <section id="location" className="location-v11" aria-labelledby="location-title">
  <div className="location-v11-shell">
    <div className="location-v11-heading">
      <p className="location-v11-kicker">06 / {tx("FIND US","NOUS TROUVER")}</p>
      <h2 id="location-title">{lang==='es'?<>Al final de la Route des Pêches, <em>te espera el lago.</em></>:lang==='hi'?<>Route des Pêches के अंत में <em>झील आपका इंतज़ार कर रही है।</em></>:lang==='en'?<>At the end of the Coastal Road, <em>the lake awaits.</em></>:<>Au bout de la Route des Pêches, <em>le lac vous attend.</em></>}</h2>
      <p>{tx("Find AQUAMAZONE ADVENTURE in Adounko Village, Cotonou.","Retrouvez AQUAMAZONE ADVENTURE au Village Adounko, à Cotonou.")}</p>
    </div>
    <LocationRouteVideo lang={lang}/>
    <div className="location-v11-layout">
      <div className="location-v11-map">
        <iframe title={tx("Map of Togbin Plage, Benin — Aquamazone location area","Carte de Togbin Plage, Bénin — zone de localisation d’Aquamazone")} src="https://www.google.com/maps?q=Togbin+Plage,+Benin&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
        <a className="location-v11-map-link" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer"><MapPin size={17}/>{tx("Open in Google Maps","Ouvrir dans Google Maps")}<ArrowUpRight size={17}/></a>
      </div>
      <div className="location-v11-directions">
        <div className="location-v11-address"><span>{tx("OUR ADDRESS","NOTRE ADRESSE")}</span><strong>Village Adounko<br/>Route des Pêches<br/>Cotonou, Bénin</strong></div>
        <div className="location-v11-route">
          <div className="location-v11-route-head"><span>{tx("DIRECTIONS FROM COTONOU","ITINÉRAIRE DEPUIS COTONOU")}</span><span>06 {tx("STEPS","ÉTAPES")}</span></div>
          <ol>
            <li>{tx("Follow the Route des Pêches past Carrefour Club des Rois, continuing to the large Togbin Plage junction.","Sur la Route des Pêches, après le Carrefour Club des Rois, continuez tout droit jusqu’au grand Carrefour Togbin Plage.")}</li>
            <li>{tx("Pass the JBP service station.","Passez la station-service JBP.")}</li>
            <li>{tx("Continue to the next intersection.","Continuez jusqu’à la prochaine intersection.")}</li>
            <li>{tx("Follow the AQUAMAZONE signs.","Suivez les panneaux AQUAMAZONE.")}</li>
            <li>{tx("Turn right and continue towards the lake.","Tournez à droite et continuez jusqu’au lac.")}</li>
            <li>{tx("You will arrive directly at our landing.","Vous arriverez directement à notre embarcadère.")}</li>
          </ol>
        </div>
        <a className="location-v11-directions-cta" href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer">{tx("Get directions","Préparer mon itinéraire")}<ArrowUpRight size={19}/></a>
      </div>
    </div>
  </div>
</section>

<section id="visit" className="visit-v12" aria-labelledby="visit-title">
  <div className="visit-v12-shell">
    <div className="visit-v12-lead">
      <p className="visit-v12-eyebrow">07 / {tx("PLAN YOUR VISIT","PRÉPARER VOTRE VISITE")}</p>
      <h2 id="visit-title">{lang==='es'?<>El momento perfecto <em>para desconectar.</em></>:lang==='hi'?<>आराम करने <em>का सही समय।</em></>:lang==='en'?<>The perfect time <em>to get away.</em></>:<>Le bon moment <em>pour s’évader.</em></>}</h2>
      <p className="visit-v12-intro">{tx("Everything you need to know before spending your day by the water.","Les informations essentielles pour profiter pleinement de votre journée au bord de l’eau.")}</p>
    </div>
    <div className="visit-v12-grid">
      <div className="visit-v12-hours">
        <span className="visit-v12-overline">{tx("OPENING HOURS","HORAIRES D’OUVERTURE")}</span>
        <div className="visit-v12-bigtime">{lang==='fr'?<><span>11<span className="visit-v12-unit">h</span></span><span className="visit-v12-dash" aria-hidden="true">—</span><span>18<span className="visit-v12-unit">h</span></span></>:<span className="visit-v12-localized-time">{lang==='es'?'De 11 a. m. a 6 p. m.':lang==='hi'?'सुबह 11 बजे से शाम 6 बजे तक':'11am to 6pm'}</span>}</div>
        <p className="visit-v12-days">{tx("Saturday · Sunday · Public holidays","Samedi · Dimanche · Jours fériés")}</p>
        <p className="visit-v12-hours-note">{tx("Weekends, public holidays, and a chance to unwind.","Un week-end, un jour férié, une envie de prendre le large.")}</p>
      </div>
      <div className="visit-v12-groups">
        <span className="visit-v12-overline">{tx("WEEKDAY VISITS","VISITES EN SEMAINE")}</span>
        <div className="visit-v12-group-figure"><strong>06<span>+</span></strong><span>{tx("people","personnes")}</span></div>
        <h3>{tx("Better together.","L’aventure se partage.")}</h3>
        <p>{tx("On weekdays, we welcome groups of at least 6 people with advance booking. A package of 4 activities per person applies.","En semaine, nous accueillons les groupes de 6 personnes minimum, sur réservation préalable. Une formule de 4 activités par personne est prévue.")}</p>
        <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20organiser%20une%20visite%20de%20groupe%20en%20semaine." target="_blank" rel="noopener noreferrer" className="visit-v12-link">{tx("Plan a group visit","Organiser une sortie en groupe")}<ArrowUpRight size={18}/></a>
      </div>
    </div>
    <div className="visit-v12-practical">
      <div className="visit-v12-practical-heading"><span className="visit-v12-overline">{tx("GOOD TO KNOW","BON À SAVOIR")}</span><h3>{tx("Before you arrive","Avant de nous rejoindre")}</h3></div>
      <div className="visit-v12-practical-list">
        <div className="visit-v12-practical-item"><span className="visit-v12-num">01</span><div><h4>{tx("Return boat crossing","Traversée aller-retour")}</h4><p>{tx("Adult: 1,500 FCFA · Child under 12: 500 FCFA. The crossing is already included in our packages.","Adulte : 1 500 FCFA · Enfant de moins de 12 ans : 500 FCFA. La traversée est déjà incluse dans nos forfaits.")}</p></div></div>
        <div className="visit-v12-practical-item"><span className="visit-v12-num">02</span><div><h4>{tx("Restaurant & Bar","Restaurant & Bar")}</h4><p>{tx("Please confirm your food order before arriving so we can better prepare for your visit.","Pensez à confirmer votre commande avant votre arrivée afin de faciliter votre accueil.")}</p></div></div>
        <div className="visit-v12-practical-item"><span className="visit-v12-num">03</span><div><h4>{tx("Any questions before your visit?","Une question avant de venir ?")}</h4><p>{tx("Our team can help with activities, packages, and planning your day.","Notre équipe vous renseigne sur les activités, les forfaits et l’organisation de votre journée.")}</p></div></div>
      </div>
    </div>
    <div className="visit-v12-bottom">
      <div><span>{tx("NEED MORE INFORMATION?","BESOIN D’UN RENSEIGNEMENT ?")}</span><strong>+229 01 54 28 44 44</strong></div>
      <a href="https://wa.me/2290154284444?text=Bonjour%2C%20je%20souhaite%20des%20informations%20pour%20ma%20visite%20%C3%A0%20Aquamazone." target="_blank" rel="noopener noreferrer">{tx("Message us on WhatsApp","Nous écrire sur WhatsApp")}<ArrowUpRight size={19}/></a>
    </div>
  </div>
</section>

<section id="faq" className="faq-v13" aria-labelledby="faq-title">
 <div className="faq-v13-shell">
  <div className="faq-v13-intro">
   <p className="faq-v13-eyebrow">08 / {tx("FREQUENTLY ASKED QUESTIONS","QUESTIONS FRÉQUENTES")}</p>
   <h2 id="faq-title">{lang==='es'?<>Todo lo que necesitas saber <em>antes de venir.</em></>:lang==='hi'?<>आने से पहले <em>सब कुछ जानें।</em></>:lang==='en'?<>Everything to know <em>before you visit.</em></>:<>Tout savoir <em>avant de venir.</em></>}</h2>
   <p>{tx("The essentials for planning your day by the water, without the guesswork.","Les réponses essentielles pour organiser votre expérience au bord de l’eau, en toute simplicité.")}</p>
   <div className="faq-v13-contact">
    <span>{tx("SOMETHING ELSE?","UNE AUTRE QUESTION ?")}</span>
    <a href="https://wa.me/2290154284444?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20Aquamazone%20Adventure." target="_blank" rel="noopener noreferrer">{tx("Chat on WhatsApp","Parlons sur WhatsApp")}<ArrowUpRight size={18} aria-hidden="true"/></a>
   </div>
  </div>
  <div className="faq-v13-questions">
   {faqItems.map((item,i)=><details className="faq-v13-item" key={i} name="aquamazone-faq" >
    <summary><span className="faq-v13-index">{String(i+1).padStart(2,'0')}</span><span className="faq-v13-question">{lang==='es'?item.esQ:lang==='hi'?item.hiQ:item.q[contentLang]}</span><span className="faq-v13-toggle" aria-hidden="true"><Plus size={19}/></span></summary>
    <div className="faq-v13-answer"><p>{lang==='es'?item.esA:lang==='hi'?item.hiA:item.a[contentLang]}</p></div>
   </details>)}
   <p className="faq-v13-footnote">{tx("For details specific to your visit, please contact our team directly.","Pour les détails particuliers à votre sortie, contactez directement notre équipe.")}</p>
  </div>
 </div>
</section>
 <ReservationPlanner lang={lang} intent={reservationIntent}/>
 <VisitorReviews lang={lang}/>
 </main>
 <footer className="footer footer-v15" aria-label={tx("Footer","Pied de page")}>
  <div className="footer-v15-inner">
    <div className="footer-v15-opening">
      <p>{tx("ADVENTURE AWAITS","L’AVENTURE VOUS ATTEND")}</p>
      <h2>{lang==='es'?<>¿Nos vemos <em>junto al agua?</em></>:lang==='hi'?<>पानी के किनारे <em>मिलेंगे?</em></>:lang==='en'?<>See you <em>by the water?</em></>:<>On se retrouve <em>au bord de l’eau ?</em></>}</h2>
      <a href="#reservation">{tx("Plan my visit","Préparer ma visite")} <ArrowUpRight size={20} aria-hidden="true"/></a>
    </div>
    <div className="footer-v15-columns">
      <div className="footer-v15-brand">
        <a href="#top" className="footer-v15-wordmark">AQUAMAZONE <span>ADVENTURE</span></a>
        <p>La détente au fil de l’eau.</p>
        <span>Village Adounko · Route des Pêches<br/>Cotonou, Bénin</span>
      </div>
      <nav aria-label={tx("Footer navigation","Navigation du pied de page")}>
        <h3>{tx("EXPLORE","DÉCOUVRIR")}</h3>
        <a href="#activities">{tx("Activities","Nos activités")}</a>
        <a href="#packages">{tx("Packages","Nos forfaits")}</a>
        <a href="#restaurant">Restaurant & Bar</a>
        <a href="#gallery">{tx("Gallery","Galerie")}</a>
        <a href="#reservation">{tx("Plan a visit","Préparer une visite")}</a>
      </nav>
      <nav aria-label={tx("Visitor information","Informations pratiques")}>
        <h3>{tx("INFORMATION","INFORMATIONS")}</h3>
        <a href="#location">{tx("Find us","Nous trouver")}</a>
        <a href="#visit">{tx("Opening hours","Horaires & accès")}</a>
        <a href="#faq">{tx("FAQ","Questions fréquentes")}</a>
        <span>{tx("Sat., Sun. & public holidays","Sam., dim. & jours fériés")}<br/>{lang==='fr'?'11h — 18h':lang==='es'?'De 11 a. m. a 6 p. m.':lang==='hi'?'सुबह 11 बजे से शाम 6 बजे तक':'11am to 6pm'}</span>
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
    <div className="footer-v15-bottom"><span>© {new Date().getFullYear()} AQUAMAZONE Adventure</span><span>{tx("All rights reserved.","Tous droits réservés.")}</span><a href="#top">{tx("Back to top","Retour en haut")} ↑</a></div>
  </div>
</footer>
 {preview&&<div className="activity-lightbox" role="presentation" onClick={()=>setPreview(null)}>
  <div className="activity-lightbox-dialog" role="dialog" aria-modal="true" aria-label={tx("Image preview","Aperçu photo")} onClick={event=>event.stopPropagation()}>
    <button className="activity-lightbox-close" type="button" onClick={()=>setPreview(null)} aria-label={tx("Close image","Fermer l’image")}><X size={22}/></button>
    <img src={activityVisuals[preview]} alt={tx("Activity photographed at Aquamazone","Photographie de l’activité à Aquamazone")} />
    <p>{tx("Photographed at Aquamazone","Photographie prise à Aquamazone")}</p>
  </div>
 </div>}
 <AquamazoneAssistant lang={lang}/>
 </>}
