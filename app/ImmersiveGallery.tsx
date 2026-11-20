'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Lang = 'fr' | 'en';

const slides = [
  { id:'gallery-01', title:{fr:"Des moments à partager",en:"Moments together"}, meta:{fr:"Pédalo",en:"Pedalo"}, image:'/images/gallery/gallery-01.webp', alt:{fr:"Deux visiteuses sur une embarcation à pédales",en:"Two visitors on a pedal-powered craft"} },
  { id:'gallery-02', title:{fr:"Profiter du lac",en:"Enjoying the lake"}, meta:{fr:"Détente",en:"Relaxation"}, image:'/images/gallery/gallery-02.webp', alt:{fr:"Deux visiteurs sur une embarcation à pédales",en:"Two visitors on a pedal-powered craft"} },
  { id:'gallery-03', title:{fr:"À bord du kayak",en:"Kayaking together"}, meta:{fr:"Canoë-kayak",en:"Canoe-kayak"}, image:'/images/gallery/gallery-03.webp', alt:{fr:"Deux personnes en kayak orange",en:"Two people in an orange kayak"} },
  { id:'gallery-04', title:{fr:"Au cœur de la nature",en:"Close to nature"}, meta:{fr:"Lac",en:"Lake"}, image:'/images/gallery/gallery-04.webp', alt:{fr:"Bateau à pédales près de la végétation",en:"Pedal-powered boat near vegetation"} },
  { id:'gallery-06', title:{fr:"L’espace de loisirs",en:"The adventure area"}, meta:{fr:"Base nautique",en:"Waterfront"}, image:'/images/gallery/gallery-06.webp', alt:{fr:"Zone nautique avec structures gonflables",en:"Waterfront area with inflatables"} },
  { id:'gallery-11', title:{fr:"La vie au bord de l’eau",en:"Life by the water"}, meta:{fr:"Embarcations",en:"Boats"}, image:'/images/gallery/gallery-11.webp', alt:{fr:"Embarcations sur le lac",en:"Boats on the lake"} },
  { id:'gallery-14', title:{fr:"Ensemble sur le lac",en:"Out on the lake"}, meta:{fr:"Balade",en:"Boat trip"}, image:'/images/gallery/gallery-14.webp', alt:{fr:"Visiteurs à bord d’un bateau à moteur",en:"Visitors aboard a motorboat"} },
  { id:'gallery-15', title:{fr:"Des souvenirs sur l’eau",en:"Memories on the water"}, meta:{fr:"Visiteurs",en:"Visitors"}, image:'/images/gallery/gallery-15.webp', alt:{fr:"Visiteurs sur des embarcations",en:"Visitors on boats"} },
  { id:'gallery-17', title:{fr:"Sur une planche",en:"On a paddleboard"}, meta:{fr:"Paddle",en:"Paddle"}, image:'/images/gallery/gallery-17.webp', alt:{fr:"Stand-up paddle sur le lac",en:"Stand-up paddle on the lake"} },
  { id:'gallery-18', title:{fr:"L’aventure en canoë",en:"Canoe adventure"}, meta:{fr:"Canoë",en:"Canoe"}, image:'/images/gallery/gallery-18.webp', alt:{fr:"Plusieurs canoës sur le lac",en:"Several canoes on the lake"} },
  { id:'gallery-19', title:{fr:"Bienvenue à Aquamazone",en:"Welcome to Aquamazone"}, meta:{fr:"La base",en:"The venue"}, image:'/images/gallery/gallery-19.webp', alt:{fr:"Vue de la base nautique Aquamazone",en:"View of the Aquamazone waterfront base"} },
];

export default function ImmersiveGallery({ lang }: { lang: Lang }) {
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
            <p className="gallery-immersive-kicker">05 / {lang === 'fr' ? 'GALERIE' : 'GALLERY'}</p>
            <h2 id="gallery-title">{lang === 'fr' ? <>Des moments <em>à vivre.</em></> : <>Moments <em>to remember.</em></>}</h2>
          </div>
          <p className="gallery-scroll-hint"><ArrowDown size={17} aria-hidden="true"/> {lang === 'fr' ? 'Défilez pour découvrir' : 'Scroll to explore'}</p>
        </div>
        <div className="gallery-viewport" ref={viewportRef}>
          <div className="gallery-track" ref={trackRef}>
            {slides.map((slide, index) => (
              <figure className={'gallery-frame gallery-frame-' + (index % 3)} key={slide.id}>
                <button type="button" className="gallery-photo-button" onClick={() => setLightboxIndex(index)} aria-label={(lang === 'fr' ? 'Agrandir : ' : 'Expand: ') + slide.title[lang]}>
                  <img src={slide.image} alt={slide.alt[lang]} loading="lazy" decoding="async"/>
                  <span className="gallery-view-hint">{lang === 'fr' ? 'Voir la photo' : 'View photo'} <ArrowUpRight size={16} aria-hidden="true"/></span>
                </button>
                <figcaption>
                  <span>{String(index + 1).padStart(2,'0')} / {slide.meta[lang]}</span>
                  <strong>{slide.title[lang]}</strong>
                </figcaption>
              </figure>
            ))}
            <div className="gallery-finale" aria-hidden="true"><span>AQUAMAZONE</span><strong>{lang === 'fr' ? 'À bientôt au bord de l’eau.' : 'See you by the water.'}</strong></div>
          </div>
        </div>
        <div className="gallery-immersive-footer">
          <span>{lang === 'fr' ? 'Photos prises à Aquamazone Adventure' : 'Photographs taken at Aquamazone Adventure'}</span>
          <div className="gallery-progress" aria-hidden="true"><div ref={progressRef}/></div>
          <span className="gallery-progress-label">01 — {String(slides.length).padStart(2,'0')}</span>
        </div>
      </div>
      {lightboxIndex !== null && (
        <div className="gallery-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setLightboxIndex(null); }}>
          <div className="gallery-modal-inner" role="dialog" aria-modal="true" aria-label={lang === 'fr' ? 'Photo agrandie' : 'Enlarged photograph'}>
            <button className="gallery-modal-close" onClick={() => setLightboxIndex(null)} aria-label={lang === 'fr' ? 'Fermer' : 'Close'}><X size={24}/></button>
            <img src={slides[lightboxIndex].image} alt={slides[lightboxIndex].alt[lang]}/>
            <div className="gallery-modal-bottom">
              <button onClick={() => setLightboxIndex((lightboxIndex + slides.length - 1) % slides.length)} aria-label={lang === 'fr' ? 'Précédente' : 'Previous'}><ChevronLeft size={22}/></button>
              <p>{slides[lightboxIndex].title[lang]} <span>· Aquamazone Adventure</span></p>
              <button onClick={() => setLightboxIndex((lightboxIndex + 1) % slides.length)} aria-label={lang === 'fr' ? 'Suivante' : 'Next'}><ChevronRight size={22}/></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
