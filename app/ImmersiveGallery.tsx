'use client';

import { useEffect, useRef, useState } from 'react';
import type {PublicLanguage} from '../lib/public-i18n';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Lang = PublicLanguage;

const slides = [
  { id:'gallery-01', title:{fr:"Des moments à partager",en:"Moments together",es:"Momentos para compartir",hi:"साथ बिताए पल"}, meta:{fr:"Pédalo",en:"Pedalo",es:"Pedaló",hi:"पेडलो"}, image:'/images/gallery/gallery-01.webp', alt:{fr:"Deux visiteuses sur une embarcation à pédales",en:"Two visitors on a pedal-powered craft",es:"Dos visitantes en una embarcación a pedales",hi:"पैडल नाव में दो आगंतुक"} },
  { id:'gallery-02', title:{fr:"Profiter du lac",en:"Enjoying the lake",es:"Disfrutar del lago",hi:"झील का आनंद"}, meta:{fr:"Détente",en:"Relaxation",es:"Descanso",hi:"आराम"}, image:'/images/gallery/gallery-02.webp', alt:{fr:"Deux visiteurs sur une embarcation à pédales",en:"Two visitors on a pedal-powered craft",es:"Dos visitantes en una embarcación a pedales",hi:"पैडल नाव में दो आगंतुक"} },
  { id:'gallery-03', title:{fr:"À bord du kayak",en:"Kayaking together",es:"En kayak",hi:"कायक की सैर"}, meta:{fr:"Canoë-kayak",en:"Canoe-kayak",es:"Canoa-kayak",hi:"कैनो-कायक"}, image:'/images/gallery/gallery-03.webp', alt:{fr:"Deux personnes en kayak orange",en:"Two people in an orange kayak",es:"Dos personas en un kayak naranja",hi:"नारंगी कायक में दो लोग"} },
  { id:'gallery-04', title:{fr:"Au cœur de la nature",en:"Close to nature",es:"En plena naturaleza",hi:"प्रकृति के बीच"}, meta:{fr:"Lac",en:"Lake",es:"Lago",hi:"झील"}, image:'/images/gallery/gallery-04.webp', alt:{fr:"Bateau à pédales près de la végétation",en:"Pedal-powered boat near vegetation",es:"Barco a pedales cerca de la vegetación",hi:"पेड़ों के पास पैडल बोट"} },
  { id:'gallery-06', title:{fr:"L’espace de loisirs",en:"The adventure area",es:"La zona de aventuras",hi:"रोमांच का क्षेत्र"}, meta:{fr:"Base nautique",en:"Waterfront",es:"Base acuática",hi:"जल गतिविधि केंद्र"}, image:'/images/gallery/gallery-06.webp', alt:{fr:"Zone nautique avec structures gonflables",en:"Waterfront area with inflatables",es:"Zona acuática con estructuras inflables",hi:"फुलाने वाली संरचनाओं वाला जल क्षेत्र"} },
  { id:'gallery-11', title:{fr:"La vie au bord de l’eau",en:"Life by the water",es:"La vida junto al agua",hi:"पानी के किनारे जीवन"}, meta:{fr:"Embarcations",en:"Boats",es:"Embarcaciones",hi:"नावें"}, image:'/images/gallery/gallery-11.webp', alt:{fr:"Embarcations sur le lac",en:"Boats on the lake",es:"Embarcaciones en el lago",hi:"झील पर नावें"} },
  { id:'gallery-14', title:{fr:"Ensemble sur le lac",en:"Out on the lake",es:"Juntos en el lago",hi:"झील पर साथ"}, meta:{fr:"Balade",en:"Boat trip",es:"Paseo en barco",hi:"नाव की सैर"}, image:'/images/gallery/gallery-14.webp', alt:{fr:"Visiteurs à bord d’un bateau à moteur",en:"Visitors aboard a motorboat",es:"Visitantes a bordo de una lancha motora",hi:"मोटर बोट में आगंतुक"} },
  { id:'gallery-15', title:{fr:"Des souvenirs sur l’eau",en:"Memories on the water",es:"Recuerdos en el agua",hi:"पानी पर यादें"}, meta:{fr:"Visiteurs",en:"Visitors",es:"Visitantes",hi:"आगंतुक"}, image:'/images/gallery/gallery-15.webp', alt:{fr:"Visiteurs sur des embarcations",en:"Visitors on boats",es:"Visitantes en embarcaciones",hi:"नावों में आगंतुक"} },
  { id:'gallery-17', title:{fr:"Sur une planche",en:"On a paddleboard",es:"Sobre una tabla",hi:"पैडल बोर्ड पर"}, meta:{fr:"Paddle",en:"Paddle",es:"Paddle",hi:"पैडल"}, image:'/images/gallery/gallery-17.webp', alt:{fr:"Stand-up paddle sur le lac",en:"Stand-up paddle on the lake",es:"Paddle surf en el lago",hi:"झील में स्टैंड-अप पैडल"} },
  { id:'gallery-18', title:{fr:"L’aventure en canoë",en:"Canoe adventure",es:"Aventura en canoa",hi:"कैनो का रोमांच"}, meta:{fr:"Canoë",en:"Canoe",es:"Canoa",hi:"कैनो"}, image:'/images/gallery/gallery-18.webp', alt:{fr:"Plusieurs canoës sur le lac",en:"Several canoes on the lake",es:"Varias canoas en el lago",hi:"झील पर कई कैनो"} },
  { id:'gallery-19', title:{fr:"Bienvenue à Aquamazone",en:"Welcome to Aquamazone",es:"Bienvenidos a Aquamazone",hi:"Aquamazone में स्वागत है"}, meta:{fr:"La base",en:"The venue",es:"El centro",hi:"केंद्र"}, image:'/images/gallery/gallery-19.webp', alt:{fr:"Vue de la base nautique Aquamazone",en:"View of the Aquamazone waterfront base",es:"Vista de la base acuática Aquamazone",hi:"Aquamazone जल केंद्र का दृश्य"} },
];

export default function ImmersiveGallery({ lang }: { lang: Lang }) {
  const locale: 'fr'|'en'|'es'|'hi'=lang==='fon'?'en':lang;
  const tr=(fr:string,en:string,es:string,hi:string)=>lang==='fr'?fr:lang==='es'?es:lang==='hi'?hi:en;
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const init = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !stageRef.current || !trackRef.current || !viewportRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const stage = stageRef.current;
      const track = trackRef.current;
      const viewport = viewportRef.current;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference) and (min-height: 560px)', () => {
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: () => '+=' + Math.max(350, distance() * 0.78),
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (progressRef.current) progressRef.current.style.transform = 'scaleX(' + self.progress + ')';
            },
          },
        });
        const resize = new ResizeObserver(() => ScrollTrigger.refresh());
        resize.observe(viewport);
        resize.observe(track);
        return () => {
          resize.disconnect();
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });
      cleanup = () => mm.revert();
      ScrollTrigger.refresh();
    };
    void init();
    return () => { cancelled = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowRight') setLightboxIndex((i) => i === null ? 0 : (i + 1) % slides.length);
      if (event.key === 'ArrowLeft') setLightboxIndex((i) => i === null ? 0 : (i + slides.length - 1) % slides.length);
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [lightboxIndex]);

  return (
    <section id="gallery" className="gallery-immersive" aria-labelledby="gallery-title">
      <div className="gallery-stage" ref={stageRef}>
        <div className="gallery-immersive-header">
          <div>
            <p className="gallery-immersive-kicker">05 / {tr("GALERIE","GALLERY","GALERÍA","गैलरी")}</p>
            <h2 id="gallery-title">{lang==='es'?<>Momentos <em>para recordar.</em></>:lang==='hi'?<>यादगार <em>पल।</em></>:lang==='fr'?<>Des moments <em>à vivre.</em></>:<>Moments <em>to remember.</em></>}</h2>
          </div>
          <p className="gallery-scroll-hint"><ArrowDown size={17} aria-hidden="true"/> {tr("Défilez pour découvrir","Scroll to explore","Desliza para descubrir","देखने के लिए स्क्रॉल करें")}</p>
        </div>
        <div className="gallery-viewport" ref={viewportRef}>
          <div className="gallery-track" ref={trackRef}>
            {slides.map((slide, index) => (
              <figure className={'gallery-frame gallery-frame-' + (index % 3)} key={slide.id}>
                <button type="button" className="gallery-photo-button" onClick={() => setLightboxIndex(index)} aria-label={(tr("Agrandir : ","Expand: ","Ampliar: ","बड़ा करें: ")) + slide.title[locale]}>
                  <img src={slide.image} alt={slide.alt[locale]} loading="lazy" decoding="async"/>
                  <span className="gallery-view-hint">{tr("Voir la photo","View photo","Ver foto","तस्वीर देखें")} <ArrowUpRight size={16} aria-hidden="true"/></span>
                </button>
                <figcaption>
                  <span>{String(index + 1).padStart(2,'0')} / {slide.meta[locale]}</span>
                  <strong>{slide.title[locale]}</strong>
                </figcaption>
              </figure>
            ))}
            <div className="gallery-finale" aria-hidden="true"><span>AQUAMAZONE</span><strong>{tr("À bientôt au bord de l’eau.","See you by the water.","Nos vemos junto al agua.","पानी के किनारे मिलेंगे।")}</strong></div>
          </div>
        </div>
        <div className="gallery-immersive-footer">
          <span>{tr("Photos prises à Aquamazone Adventure","Photographs taken at Aquamazone Adventure","Fotos tomadas en Aquamazone Adventure","Aquamazone Adventure में ली गई तस्वीरें")}</span>
          <div className="gallery-progress" aria-hidden="true"><div ref={progressRef}/></div>
          <span className="gallery-progress-label">01 — {String(slides.length).padStart(2,'0')}</span>
        </div>
      </div>
      {lightboxIndex !== null && (
        <div className="gallery-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setLightboxIndex(null); }}>
          <div className="gallery-modal-inner" role="dialog" aria-modal="true" aria-label={tr("Photo agrandie","Enlarged photograph","Foto ampliada","बड़ी तस्वीर")}>
            <button className="gallery-modal-close" onClick={() => setLightboxIndex(null)} aria-label={tr("Fermer","Close","Cerrar","बंद करें")}><X size={24}/></button>
            <img src={slides[lightboxIndex].image} alt={slides[lightboxIndex].alt[locale]}/>
            <div className="gallery-modal-bottom">
              <button onClick={() => setLightboxIndex((lightboxIndex + slides.length - 1) % slides.length)} aria-label={tr("Précédente","Previous","Anterior","पिछला")}><ChevronLeft size={22}/></button>
              <p>{slides[lightboxIndex].title[locale]} <span>· Aquamazone Adventure</span></p>
              <button onClick={() => setLightboxIndex((lightboxIndex + 1) % slides.length)} aria-label={tr("Suivante","Next","Siguiente","अगला")}><ChevronRight size={22}/></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
