'use client';
import {useState} from 'react';
import {ADMIN_ACTIVITIES,ADMIN_PACKAGES,type AdminActivity,type AdminPackage} from '../lib/admin-experience-selection';
import {Check,ChevronDown,Users,Minus,Plus} from 'lucide-react';

const activities:Record<AdminActivity,{label:string,detail:string}>={
 pedalo:{label:'Pédalo',detail:'30 min'},canoe:{label:'Canoë / Kayak',detail:'30 min'},
 paddle:{label:'Paddle / Stand Up',detail:'30 min'},waterball:{label:'Bulle gonflable',detail:'20 min'},
 pedalboat:{label:'Bateau à pédales',detail:'30 min'},lake:{label:'Balade sur le lac',detail:'30 min'},
 mangrove:{label:'Découverte des mangroves',detail:'1 h'}
};
const packages:Record<AdminPackage,{title:string,detail:string}>={
 glele:{title:'GLÈLÈ',detail:'Solo · une activité au choix'},
 guezo:{title:'GUÉZO',detail:'Couple · traversée et activités incluses'},
 toffa:{title:'TOFFA',detail:'Famille · 2 adultes et 2 enfants'},
 behanzin:{title:'BÉHANZIN',detail:'Groupe · 4 adultes'}
};
export default function AdminExperienceFields(){
 const [mode,setMode]=useState<'custom'|'package'>('custom');
 const [selectedPackage,setSelectedPackage]=useState<AdminPackage|null>(null);
 const [selected,setSelected]=useState<AdminActivity[]>([]);
 const [choice,setChoice]=useState<'canoe'|'pedalo'>('canoe');
 const [adults,setAdults]=useState(2);
 const [children,setChildren]=useState(0);
 const toggle=(id:AdminActivity)=>setSelected(old=>old.includes(id)?old.filter(a=>a!==id):[...old,id]);
 const change=(key:'adults'|'children',diff:number)=>{
  if(key==='adults')setAdults(a=>Math.max(0,Math.min(20-children,a+diff)));
  else setChildren(c=>Math.max(0,Math.min(20-adults,c+diff)));
 };
 return <div className="az-intake-flow">
  <div className="az-intake-section-head"><span className="az-intake-step">02</span><div><h3>Choisir l’expérience</h3><p>Sélectionnez les activités à la carte ou un forfait. Les tarifs et disponibilités restent à confirmer.</p></div></div>
  <div className="az-intake-tabs" role="group" aria-label="Type d’expérience">
   <button type="button" className={mode==='custom'?'is-current':''} aria-pressed={mode==='custom'} onClick={()=>setMode('custom')}>À la carte</button>
   <button type="button" className={mode==='package'?'is-current':''} aria-pressed={mode==='package'} onClick={()=>setMode('package')}>Forfaits</button>
  </div>
  {mode==='custom'?
   <div className="az-intake-choices">
    {ADMIN_ACTIVITIES.map(id=><label key={id} className={'az-intake-choice'+(selected.includes(id)?' is-selected':'')}>
     <input name="activities" type="checkbox" value={id} checked={selected.includes(id)} onChange={()=>toggle(id)}/>
     <span className="az-intake-choice-copy"><strong>{activities[id].label}</strong><small>{activities[id].detail}</small></span>
     <span className="az-intake-check" aria-hidden="true">{selected.includes(id)?<Check size={15}/>:<Plus size={16}/>}</span>
    </label>)}
   </div>:
   <div className="az-intake-choices az-intake-package-choices">
    {ADMIN_PACKAGES.map(id=><label key={id} className={'az-intake-choice'+(selectedPackage===id?' is-selected':'')}>
     <input type="radio" name="package-option" value={id} checked={selectedPackage===id} onChange={()=>setSelectedPackage(id)}/>
     <span className="az-intake-choice-copy"><strong>{packages[id].title}</strong><small>{packages[id].detail}</small></span>
     <span className="az-intake-check" aria-hidden="true">{selectedPackage===id?<Check size={15}/>:<Plus size={16}/>}</span>
    </label>)}
   </div>}
  <input type="hidden" name="package" value={mode==='package'?selectedPackage??'':''}/>
  {/* Inputs for the inactive mode are not submitted. Switching modes preserves the selection. */}
  {mode==='package'&&selectedPackage==='glele'&&<label className="az-intake-choice-detail">Activité comprise dans GLÈLÈ
    <span className="az-intake-select-wrap"><select name="choice" value={choice} onChange={event=>setChoice(event.target.value as 'canoe'|'pedalo')}><option value="canoe">Canoë simple</option><option value="pedalo">Pédalo simple</option></select><ChevronDown size={16}/></span>
   </label>}
  {/* Only the active experience mode participates in the existing admin validation. */}
  {mode==='package'&&selected.length>0&&selected.map(id=><input key={id} type="hidden" name="activities" disabled value={id}/>)}
  {mode==='custom'&&selectedPackage&&<input type="hidden" name="package" disabled value={selectedPackage}/>}
  <p className="az-intake-selection-hint" role="status">{mode==='custom'?selected.length>0?`${selected.length} activité${selected.length>1?'s':''} sélectionnée${selected.length>1?'s':''}`:'Sélectionnez au moins une activité.':selectedPackage?`Forfait ${packages[selectedPackage].title} sélectionné`:'Sélectionnez un forfait.'}</p>
  <div className="az-intake-section-head az-intake-persons-heading"><span className="az-intake-step">03</span><div><h3>Participants</h3><p>Indiquez le nombre d’adultes et d’enfants de moins de 12 ans.</p></div></div>
  <div className="az-intake-counter-grid">
   {([{key:'adults',label:'Adultes',value:adults},{key:'children',label:'Enfants · moins de 12 ans',value:children}] as const).map(item=><div className="az-intake-counter" key={item.key}>
    <span>{item.label}</span>
    <div><button type="button" onClick={()=>change(item.key,-1)} disabled={item.value<=0} aria-label={'Retirer un '+(item.key==='adults'?'adulte':'enfant')}><Minus size={16}/></button><strong aria-live="polite">{item.value}</strong><button type="button" onClick={()=>change(item.key,1)} disabled={adults+children>=20} aria-label={'Ajouter un '+(item.key==='adults'?'adulte':'enfant')}><Plus size={16}/></button></div>
   </div>)}
  </div>
  <input type="hidden" name="adults" value={adults}/>
  <input type="hidden" name="children" value={children}/>
  <div className="az-intake-crossing">
   <div><Users size={17}/><strong>Traversée aller-retour</strong><span>{mode==='package'?'Incluse dans le forfait':'Tarif indicatif'}</span></div>
   <p>{adults} adulte{adults!==1?'s':''} × 1 500 FCFA = {(adults*1500).toLocaleString('fr-FR')} FCFA</p>
   <p>{children} enfant{children!==1?'s':''} × 500 FCFA = {(children*500).toLocaleString('fr-FR')} FCFA</p>
   <div className="az-intake-crossing-total"><span>{mode==='package'?'Traversée comprise · non refacturée':'Total traversée'}</span><strong>{(adults*1500+children*500).toLocaleString('fr-FR')} FCFA</strong></div>
  </div>
 </div>;
}
