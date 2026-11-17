'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, MessageCircle, Send, Waves, X } from 'lucide-react';

type Lang = 'fr' | 'en';
type Message = { id: number; role: 'assistant' | 'user'; text: string };
const contact = 'https://wa.me/2290154284444';
const content = {
  fr: {
    name:'Assistant Aquamazone', status:'Informations & orientation', welcome:'Bonjour et bienvenue à AQUAMAZONE ADVENTURE ! Nous proposons des activités nautiques, des balades sur le lac, ainsi qu’un Restaurant & Bar. Comment puis-je vous aider ?', intro:'Choisissez une question ou écrivez-nous.', placeholder:'Posez votre question…', send:'Envoyer', close:'Fermer', back:'Retour', open:'Ouvrir l’assistant', helper:'Réponses IA fondées sur les informations officielles. Aucune réservation ni paiement dans ce chat.', fallback:'Je n’ai pas de réponse confirmée à cette question. Notre équipe pourra vous renseigner sur WhatsApp.', handoff:'Contacter notre équipe', handoffLabel:'Une question plus précise ?', badge:'ASSISTANT', questions:['Quels sont les horaires ?','Où êtes-vous situés ?','Quels sont les tarifs ?','Comment réserver ?'], 
    answers:[
      {keys:['horaire','ouvert','ouverture','fermé','jour','weekend','week-end'],text:'Nous sommes ouverts les samedis, dimanches et jours fériés, de 11h à 18h. Les groupes de 6 personnes minimum peuvent organiser une visite en semaine sur réservation préalable.'},
      {keys:['où','ou','adresse','situé','localisation','trouver','itinéraire','aller','venir'],text:'Nous sommes situés au Village Adounko, Route des Pêches, Cotonou, Bénin. Depuis Carrefour Club des Rois, passez Togbin Plage puis la station JBP, et suivez les panneaux AQUAMAZONE jusqu’à l’embarcadère.'},
      {keys:['tarif','prix','coût','combien','pédalo','kayak','canoë','paddle','water ball','bulle'],text:'Pédalo, canoë-kayak, paddle et water ball : 3 000 FCFA par personne (30 min, sauf water ball : 20 min). La traversée aller-retour coûte 1 500 FCFA par adulte ou 500 FCFA par enfant de moins de 12 ans, sauf si elle est incluse dans votre forfait.'},
      {keys:['réserv','reservation','paiement','payer','disponibilit','place'],text:'Pour organiser votre visite et vérifier les disponibilités, contactez notre équipe sur WhatsApp au +229 01 54 28 44 44. La réservation et le paiement en ligne ne sont pas encore disponibles sur ce site.'},
      {keys:['restaurant','manger','repas','boisson','bar','poisson'],text:'Notre Restaurant & Bar propose notamment du bar et de la carpe braisés, des brochettes de poulet, plusieurs accompagnements et des boissons fraîches. Confirmez votre commande avant votre arrivée.'},
      {keys:['groupe','semaine','six personne','6 personne'],text:'Les visites en semaine sont organisées pour des groupes d’au moins 6 personnes, sur réservation préalable, avec 4 activités par personne. Contactez-nous sur WhatsApp pour les modalités.'},
      {keys:['jet ski','jetski','jet-ski'],text:'Le jet-ski est actuellement indisponible pour maintenance et ne peut pas être réservé.'},
      {keys:['forfait','glèlè','glèlè','guézo','toffa','béhanzin'],text:'Le forfait solo GLÈLÈ comprend la traversée aller-retour et UNE activité au choix : canoë simple OU pédalo simple pendant 30 minutes. Tarif : 5 000 FCFA par adulte, 3 500 FCFA par enfant. Notre équipe peut confirmer les autres forfaits sur WhatsApp.'}
    ]
  },
  en: {
    name:'Aquamazone Assistant',status:'Information & guidance',welcome:'Hello and welcome to AQUAMAZONE ADVENTURE! We offer water activities, lake outings and a Restaurant & Bar. How can I help?',intro:'Choose a question or write to us.',placeholder:'Ask a question…',send:'Send',close:'Close',back:'Back',open:'Open assistant',helper:'AI answers based on official business information. No bookings or payments in this chat.',fallback:'I don’t have a verified answer to that question. Our team can help you on WhatsApp.',handoff:'Contact our team',handoffLabel:'Need more details?',badge:'ASSISTANT',questions:['When are you open?','Where are you located?','What are the prices?','How do I book?'],
    answers:[
      {keys:['hour','open','opening','time','weekend','day'],text:'We are open Saturdays, Sundays and public holidays from 11am to 6pm. Weekday visits can be arranged in advance for groups of at least 6 people.'},
      {keys:['where','location','address','direction','find','get there'],text:'We are at Adounko Village, Route des Pêches, Cotonou, Benin. From Carrefour Club des Rois, pass the Togbin Plage junction and JBP station, then follow the AQUAMAZONE signs to the landing.'},
      {keys:['price','cost','how much','rate','pedal','canoe','kayak','paddle','water ball'],text:'Pedal boat, canoe-kayak, stand-up paddle and water ball cost 3,000 FCFA per person (30 minutes, except water ball: 20 minutes). Return crossing is 1,500 FCFA per adult or 500 FCFA per child under 12, unless included in your package.'},
      {keys:['book','reserv','pay','payment','available'],text:'To arrange a visit or confirm availability, message our team on WhatsApp at +229 01 54 28 44 44. Online reservations and payments are not yet active.'},
      {keys:['food','restaurant','eat','drink','bar','fish'],text:'Our Restaurant & Bar offers grilled bar fish and carp, chicken skewers, sides and cold drinks. Please confirm your food order before arrival.'},
      {keys:['group','weekday','six people','6 people'],text:'Weekday visits are available for groups of at least 6 people by advance arrangement, with 4 activities per person. Contact us on WhatsApp for details.'},
      {keys:['jet ski','jetski'],text:'Jet skiing is currently unavailable due to maintenance and cannot be booked.'},
      {keys:['package','glèlè','guézo','toffa','béhanzin'],text:'The GLÈLÈ solo package includes the return crossing and ONE activity of your choice: single canoe OR single pedal boat for 30 minutes. It costs 5,000 FCFA per adult and 3,500 FCFA per child. Our team can confirm other packages on WhatsApp.'}
    ]
  }
} as const;

export default function AquamazoneAssistant({lang}:{lang:Lang}) {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState('');
  const [pending,setPending]=useState(false);
  const pendingRef=useRef(false);
  const [messages,setMessages]=useState<Message[]>([]);
  const scrollRef=useRef<HTMLDivElement>(null);
  const inputRef=useRef<HTMLInputElement>(null);
  const panelRef=useRef<HTMLElement>(null);
  const launcherRef=useRef<HTMLButtonElement>(null);
  const idRef=useRef(0);
  const t=content[lang];
  const displayMessages=messages.length?messages:[{id:-1,role:'assistant' as const,text:t.welcome}];

  useEffect(()=>{if(open){scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'});}},[messages,open]);
  useEffect(()=>{
    if(!open)return;
    inputRef.current?.focus();
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setOpen(false);launcherRef.current?.focus();}
      if(event.key==='Tab' && panelRef.current){
        const els=Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])'));
        if(!els.length)return;
        const first=els[0],last=els[els.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',handleKey);
    return()=>document.removeEventListener('keydown',handleKey);
  },[open]);

  const send=async(text:string)=>{
    const question=text.trim().slice(0,400);
    if(!question || pendingRef.current)return;
    pendingRef.current=true;
    setPending(true);
    const existing=messages.length?messages:[{id:idRef.current++,role:'assistant' as const,text:t.welcome}];
    const history=existing.filter((m)=>m.id>=0).slice(-8).map(m=>({role:m.role,content:m.text.slice(0,500)}));
    setMessages([...existing,{id:idRef.current++,role:'user',text:question}]);
    setDraft('');
    try {
      const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,language:lang,history})});
      const data=await response.json() as {reply?:string;unavailable?:boolean};
      if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('No assistant reply');
      setMessages(current=>[...current,{id:idRef.current++,role:'assistant',text:data.reply!.trim().slice(0,1800)}]);
    } catch {
      setMessages(current=>[...current,{id:idRef.current++,role:'assistant',text:t.fallback}]);
    } finally {
      pendingRef.current=false;
      setPending(false);
      inputRef.current?.focus();
    }
  };
  const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();void send(draft);};
  return <>
    <button ref={launcherRef} className={'assistant-v14-launcher'+(open?' is-open':'')} type="button" aria-label={open?t.close:t.open} aria-expanded={open} aria-controls="assistant-v14-panel" onClick={()=>setOpen(v=>!v)}>
      {open?<X size={23} aria-hidden="true"/>:<MessageCircle size={25} aria-hidden="true"/>}
      {!open&&<span className="assistant-v14-launcher-label">{lang==='fr'?'Une question ?':'Need help?'}</span>}
    </button>
    {open&&<aside id="assistant-v14-panel" ref={panelRef} className="assistant-v14-panel" role="dialog" aria-modal="false" aria-label={t.name}>
      <header className="assistant-v14-head">
        <span className="assistant-v14-mark" aria-hidden="true"><Waves size={21}/></span>
        <div className="assistant-v14-head-copy"><strong>{t.name}</strong><span><i aria-hidden="true"/>{t.status}</span></div>
        <span className="assistant-v14-preview">{t.badge}</span>
        <button type="button" className="assistant-v14-close" onClick={()=>{setOpen(false);launcherRef.current?.focus();}} aria-label={t.close}><X size={21}/></button>
      </header>
      <div className="assistant-v14-content" ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions text">
        <div className="assistant-v14-date">AQUAMAZONE ADVENTURE</div>
        {displayMessages.map(message=><div key={message.id} className={'assistant-v14-message '+message.role}>
          {message.role==='assistant'&&<span className="assistant-v14-avatar" aria-hidden="true"><Waves size={14}/></span>}
          <p>{message.text}</p>
        </div>)}
        {pending&&<div className="assistant-v14-message assistant"><span className="assistant-v14-avatar" aria-hidden="true"><Waves size={14}/></span><p role="status">{lang==='fr'?'Je prépare ma réponse…':'Preparing a response…'}</p></div>}
        {messages.length===0&&<div className="assistant-v14-suggestions"><span>{t.intro}</span>{t.questions.map(q=><button key={q} onClick={()=>void send(q)} disabled={pending} type="button">{q}<ArrowUpRight size={16} aria-hidden="true"/></button>)}</div>}
        <div className="assistant-v14-handoff"><span>{t.handoffLabel}</span><a href={contact} target="_blank" rel="noopener noreferrer">{t.handoff}<ArrowUpRight size={16} aria-hidden="true"/></a></div>
      </div>
      <div className="assistant-v14-bottom">
        <form onSubmit={submit}><label className="assistant-v14-visually-hidden" htmlFor="assistant-v14-input">{t.placeholder}</label><input id="assistant-v14-input" ref={inputRef} autoComplete="off" maxLength={400} placeholder={t.placeholder} value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit" disabled={!draft.trim()||pending} aria-label={t.send}><Send size={18}/></button></form>
        <p><Check size={12} aria-hidden="true"/>{t.helper}</p>
      </div>
    </aside>}
  </>;
}
