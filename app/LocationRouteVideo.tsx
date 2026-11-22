'use client';

import {useRef,useState} from 'react';
import type {PublicLanguage} from '../lib/public-i18n';
import {ArrowRight,MapPin,Play} from 'lucide-react';

type Props={lang:PublicLanguage};
const VIDEO='/videos/aquamazone-location.mp4';

/** Video is loaded only after an intentional tap: mobile bandwidth stays protected. */
export default function LocationRouteVideo({lang}:Props){
 const fr=lang==='fr';
 const es=lang==='es',hi=lang==='hi';
 const tr=(en:string,frText:string,spanish:string,hindi:string)=>es?spanish:hi?hindi:fr?frText:en;
 const player=useRef<HTMLVideoElement>(null);
 const [started,setStarted]=useState(false);
 const [failed,setFailed]=useState(false);
 const start=()=>{
  if(!player.current)return;
  setStarted(true);
  player.current.play().catch(()=>setFailed(true));
 };
 return <div className="location-route-video" aria-label={tr("Video guide to Aquamazone","Guide vidéo pour rejoindre Aquamazone","Guía en vídeo para llegar a Aquamazone","Aquamazone पहुँचने का वीडियो मार्गदर्शन")}>
  <div className="location-route-video-copy">
   <span className="location-route-video-overline">{tr("VIDEO GUIDE · LOCATION","GUIDE VIDÉO · LOCALISATION","GUÍA EN VÍDEO · UBICACIÓN","वीडियो मार्गदर्शन · स्थान")}</span>
   <h3>{tr("Follow the route to us.","Suivez le chemin jusqu’à nous.","Sigue la ruta hasta nosotros.","हम तक पहुँचने का रास्ता देखें।")}</h3>
   <p>{tr("Watch our route video to recognize the road and find the Aquamazone Adventure boarding point.","Regardez notre vidéo d’itinéraire pour reconnaître la route et rejoindre l’embarcadère d’Aquamazone Adventure.","Mira el vídeo de la ruta para reconocer el camino y encontrar el embarcadero de Aquamazone Adventure.","रास्ता पहचानने और Aquamazone Adventure के नाव घाट तक पहुँचने के लिए वीडियो देखें।")}</p>
   <div className="location-route-video-meta"><span><MapPin size={15} aria-hidden="true"/> Village Adounko, Route des Pêches</span><span>1 min 56 s</span></div>
   <a href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer">{tr("View the map too","Consulter aussi la carte","Ver también el mapa","नक्शा भी देखें")} <ArrowRight size={16} aria-hidden="true"/></a>
  </div>
  <div className="location-route-video-frame">
   {failed?<div className="location-route-video-unavailable" role="status">
    <strong>{tr("Video temporarily unavailable","Vidéo temporairement indisponible","Vídeo temporalmente no disponible","वीडियो अभी उपलब्ध नहीं है")}</strong>
    <p>{tr("You can still use the map and directions below to reach us.","Vous pouvez toujours utiliser la carte et les indications ci-dessous pour nous rejoindre.","Puedes usar el mapa y las indicaciones siguientes para llegar.","यहाँ पहुँचने के लिए नीचे दिए नक्शे और निर्देशों का उपयोग करें।")}</p>
   </div>:<>
    <video ref={player} className={started?'is-started':''} controls={started} playsInline preload="none" width="576" height="1024" aria-label={tr("Video directions to Aquamazone Adventure","Itinéraire vidéo vers Aquamazone Adventure","Vídeo de cómo llegar a Aquamazone Adventure","Aquamazone Adventure पहुँचने का वीडियो")} onError={()=>setFailed(true)}>
     <source src={VIDEO} type="video/mp4"/>
     {tr("Your browser does not support this video.","Votre navigateur ne prend pas en charge cette vidéo.","Tu navegador no admite este vídeo.","आपका ब्राउज़र यह वीडियो नहीं चला सकता।")}
    </video>
    {!started&&<button type="button" className="location-route-video-launch" onClick={start} aria-label={tr("Play the directions video","Lire la vidéo de l’itinéraire","Reproducir el vídeo de la ruta","रास्ते का वीडियो चलाएँ")}>
     <span className="location-route-video-play"><Play size={25} fill="currentColor" aria-hidden="true"/></span>
     <span>{tr("Watch video directions","Voir l’itinéraire en vidéo","Ver indicaciones en vídeo","वीडियो में रास्ता देखें")}</span>
     <small>{tr("Tap to play · with sound","Lecture à la demande · avec le son","Toca para reproducir · con sonido","चलाने के लिए टैप करें · आवाज़ के साथ")}</small>
    </button>}
   </>}
  </div>
 </div>;
}
