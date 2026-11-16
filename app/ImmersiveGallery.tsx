'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Lang = 'fr' | 'en';

const slides = [
  { id: 'water', title: { fr: 'Au fil de l’eau', en: 'By the water' }, meta: { fr: 'Évasion', en: 'Escape' }, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=82&auto=format&fit=crop' },
  { id: 'nature', title: { fr: 'La nature en grand', en: 'Into nature' }, meta: { fr: 'Découverte', en: 'Discovery' }, image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1400&q=82&auto=format&fit=crop' },
  { id: 'adventure', title: { fr: 'L’appel de l’aventure', en: 'The call of adventure' }, meta: { fr: 'Aventure', en: 'Adventure' }, image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1400&q=82&auto=format&fit=crop' },
  { id: 'moments', title: { fr: 'Des instants à partager', en: 'Moments together' }, meta: { fr: 'Souvenirs', en: 'Memories' }, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=82&auto=format&fit=crop' },
  { id: 'horizon', title: { fr: 'Encore un peu de bleu', en: 'A little more blue' }, meta: { fr: 'Détente', en: 'Relaxation' }, image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1400&q=82&auto=format&fit=crop' },
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
            end: () => '+=' + Math.max(350, distance()),
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
                  <img src={slide.image} alt={lang === 'fr' ? 'Photographie paysagère illustrative, non prise à Aquamazone' : 'Illustrative landscape photography, not taken at Aquamazone'} loading="lazy" decoding="async"/>
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
          <span>{lang === 'fr' ? 'Images d’illustration — photos officielles à venir' : 'Illustrative imagery — official photos coming soon'}</span>
          <div className="gallery-progress" aria-hidden="true"><div ref={progressRef}/></div>
          <span className="gallery-progress-label">01 — 05</span>
        </div>
      </div>
      {lightboxIndex !== null && (
        <div className="gallery-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setLightboxIndex(null); }}>
          <div className="gallery-modal-inner" role="dialog" aria-modal="true" aria-label={lang === 'fr' ? 'Photo agrandie' : 'Enlarged photograph'}>
            <button className="gallery-modal-close" onClick={() => setLightboxIndex(null)} aria-label={lang === 'fr' ? 'Fermer' : 'Close'}><X size={24}/></button>
            <img src={slides[lightboxIndex].image} alt={lang === 'fr' ? 'Image illustrative, pas une photo d’Aquamazone' : 'Illustrative image, not a photo of Aquamazone'}/>
            <div className="gallery-modal-bottom">
              <button onClick={() => setLightboxIndex((lightboxIndex + slides.length - 1) % slides.length)} aria-label={lang === 'fr' ? 'Précédente' : 'Previous'}><ChevronLeft size={22}/></button>
              <p>{slides[lightboxIndex].title[lang]} <span>· {lang === 'fr' ? 'Illustration' : 'Illustrative'}</span></p>
              <button onClick={() => setLightboxIndex((lightboxIndex + 1) % slides.length)} aria-label={lang === 'fr' ? 'Suivante' : 'Next'}><ChevronRight size={22}/></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
