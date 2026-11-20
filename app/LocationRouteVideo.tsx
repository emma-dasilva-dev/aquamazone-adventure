'use client';

import {useRef,useState} from 'react';
import {ArrowRight,MapPin,Play} from 'lucide-react';

type Props={lang:'fr'|'en'};
const VIDEO='/videos/aquamazone-location.mp4';

/** Video is loaded only after an intentional tap: mobile bandwidth stays protected. */
export default function LocationRouteVideo({lang}:Props){
 const fr=lang==='fr';
 const player=useRef<HTMLVideoElement>(null);
 const [started,setStarted]=useState(false);
 const [failed,setFailed]=useState(false);
 const start=()=>{
  if(!player.current)return;
  setStarted(true);
  player.current.play().catch(()=>setFailed(true));
 };
 return <div className="location-route-video" aria-label={fr?'Guide vidéo pour rejoindre Aquamazone':'Video guide to Aquamazone'}>
  <div className="location-route-video-copy">
   <span className="location-route-video-overline">{fr?'GUIDE VIDÉO · LOCALISATION':'VIDEO GUIDE · LOCATION'}</span>
   <h3>{fr?'Suivez le chemin jusqu’à nous.':'Follow the route to us.'}</h3>
   <p>{fr?'Regardez notre vidéo d’itinéraire pour reconnaître la route et rejoindre l’embarcadère d’Aquamazone Adventure.':'Watch our route video to recognize the road and find the Aquamazone Adventure boarding point.'}</p>
   <div className="location-route-video-meta"><span><MapPin size={15} aria-hidden="true"/> Village Adounko, Route des Pêches</span><span>1 min 56 s</span></div>
   <a href="https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE" target="_blank" rel="noopener noreferrer">{fr?'Consulter aussi la carte':'View the map too'} <ArrowRight size={16} aria-hidden="true"/></a>
  </div>
  <div className="location-route-video-frame">
   {failed?<div className="location-route-video-unavailable" role="status">
    <strong>{fr?'Vidéo temporairement indisponible':'Video temporarily unavailable'}</strong>
    <p>{fr?'Vous pouvez toujours utiliser la carte et les indications ci-dessous pour nous rejoindre.':'You can still use the map and directions below to reach us.'}</p>
   </div>:<>
    <video ref={player} className={started?'is-started':''} controls={started} playsInline preload="none" width="576" height="1024" aria-label={fr?'Itinéraire vidéo vers Aquamazone Adventure':'Video directions to Aquamazone Adventure'} onError={()=>setFailed(true)}>
     <source src={VIDEO} type="video/mp4"/>
     {fr?'Votre navigateur ne prend pas en charge cette vidéo.':'Your browser does not support this video.'}
    </video>
    {!started&&<button type="button" className="location-route-video-launch" onClick={start} aria-label={fr?'Lire la vidéo de l’itinéraire':'Play the directions video'}>
     <span className="location-route-video-play"><Play size={25} fill="currentColor" aria-hidden="true"/></span>
     <span>{fr?'Voir l’itinéraire en vidéo':'Watch video directions'}</span>
     <small>{fr?'Lecture à la demande · avec le son':'Tap to play · with sound'}</small>
    </button>}
   </>}
  </div>
 </div>;
}
