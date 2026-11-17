'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, MessageCircle, Send, Waves, X } from 'lucide-react';

type Lang = 'fr' | 'en';
type Message = { id: number; role: 'assistant' | 'user'; text: string };
const contact = 'https://wa.me/2290154284444';
const content = {
  fr: {
    name:'Assistant Aquamazone',
    status:'Informations & orientation',
    welcome:'Bonjour et bienvenue à AQUAMAZONE ADVENTURE ! Nous proposons des activités nautiques, des balades sur le lac, ainsi qu’un Restaurant & Bar. Comment puis-je vous aider ?',
    intro:'Choisissez une question ou écrivez-nous.',
    placeholder:'Posez votre question…',
    send:'Envoyer',
    close:'Fermer',
    open:'Ouvrir l’assistant',
    helper:'Informations officielles uniquement. Aucune réservation ni paiement dans ce chat.',
    guideStatus:'Mode informations vérifiées',
    aiStatus:'Assistant IA actif',
    fallback:'Le service de conversation est momentanément inaccessible sur cet appareil. Vérifiez la connexion ou réessayez. Vous pouvez aussi nous écrire sur WhatsApp.',
    noKey:'Le mode IA n’est pas configuré sur ce serveur. Les informations essentielles restent disponibles via notre guide.',
    providerError:'Le modèle IA ne répond pas actuellement sur ce serveur. Le guide peut répondre aux questions courantes.',
    connectionError:'Impossible de joindre le service depuis ce téléphone. Vérifiez que vous utilisez la même adresse du site et rechargez la page.',
    handoff:'Contacter notre équipe',
    handoffLabel:'Une question plus précise ?',
    badge:'ASSISTANT',
    questions:['Quels sont les horaires ?','Où êtes-vous situés ?','Quels sont les tarifs ?','Comment réserver ?']
  },
  en: {
    name:'Aquamazone Assistant',
    status:'Information & guidance',
    welcome:'Hello and welcome to AQUAMAZONE ADVENTURE! We offer water activities, lake outings and a Restaurant & Bar. How can I help?',
    intro:'Choose a question or write to us.',
    placeholder:'Ask a question…',
    send:'Send',
    close:'Close',
    open:'Open assistant',
    helper:'Official information only. No bookings or payments in this chat.',
    guideStatus:'Verified information mode',
    aiStatus:'Live AI assistant',
    fallback:'Chat is temporarily unavailable on this device. Check your connection and try again, or contact us on WhatsApp.',
    noKey:'Live AI is not configured on this server. Our information guide can still answer common questions.',
    providerError:'The AI model is currently unavailable on this server. Our information guide can answer common questions.',
    connectionError:'Unable to reach the service from this phone. Check that you are using the same website address and reload.',
    handoff:'Contact our team',
    handoffLabel:'Need more details?',
    badge:'ASSISTANT',
    questions:['When are you open?','Where are you located?','What are the prices?','How do I book?']
  }
} as const;

export default function AquamazoneAssistant({lang}:{lang:Lang}) {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState('');
  const [pending,setPending]=useState(false);
  const [mode,setMode]=useState<'unknown'|'ai'|'guide'>('unknown');
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
    // Opening the chat should not summon the iOS keyboard or trigger Safari focus zoom.
    if (window.matchMedia('(min-width: 601px)').matches) inputRef.current?.focus();
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

  useEffect(()=>{
    if(!open || !window.matchMedia('(max-width: 600px)').matches)return;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=oldOverflow;};
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
      const data=await response.json() as {reply?:string;unavailable?:boolean;mode?:'ai'|'guide';reason?:'no_api_key'|'provider_unavailable';error?:string};
      if (!response.ok) throw new Error(data.error||'request_failed');
      if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('No assistant reply');
      setMode(data.mode==='ai'?'ai':'guide');
      const explanation=data.reason==='no_api_key'?t.noKey:data.reason==='provider_unavailable'?t.providerError:'';
      setMessages(current=>[...current,{id:idRef.current++,role:'assistant',text:data.reply!.trim().slice(0,1800)+(explanation?'\n\n'+explanation:'')}]);
    } catch (error) {
      setMode('guide');
      const isOriginError=error instanceof Error&&error.message==='origin_rejected';
      setMessages(current=>[...current,{id:idRef.current++,role:'assistant',text:isOriginError?t.connectionError:t.fallback}]);
    } finally {
      pendingRef.current=false;
      setPending(false);
      // Keep mobile keyboard behavior under the visitor's control.
      if (window.matchMedia('(min-width: 601px)').matches) inputRef.current?.focus();
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
        <div className="assistant-v14-head-copy"><strong>{t.name}</strong><span><i aria-hidden="true"/>{mode==='guide'?t.guideStatus:mode==='ai'?t.aiStatus:t.status}</span></div>
        <span className="assistant-v14-preview">{mode==='guide'?(lang==='fr'?'GUIDE':'GUIDE'):t.badge}</span>
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
