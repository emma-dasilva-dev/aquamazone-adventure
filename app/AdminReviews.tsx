'use client';
import {useEffect,useState} from 'react';
import {Check,Trash2,ArrowLeft} from 'lucide-react';

type Review={id:string;name:string;comment:string;source:string;rating:number|null;createdAt:string;status:'pending'|'approved'|'rejected'};
const labels:Record<string,string>={social:'Réseaux sociaux',friends:'Amis / famille',search:'Recherche / Maps',nearby:'À proximité',other:'Autre'};
export default function AdminReviews(){
 const [items,setItems]=useState<Review[]>([]);
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const load=async()=>{
  setError('');
  try{
   const response=await fetch('/api/admin/reviews',{cache:'no-store'});
   const json=await response.json();
   if(!response.ok||!json.ok)throw Error(json.code??'error');
   setItems(json.reviews);
  }catch{setError('Impossible de charger les avis. Vérifiez la connexion et la configuration de la base.');}
  finally{setLoading(false);}
 };
 useEffect(()=>{void load();},[]);
 const act=async(id:string,status:'approved'|'rejected')=>{
  setBusy(id);setError('');
  try{
   const response=await fetch('/api/admin/reviews',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});
   const json=await response.json();
   if(!response.ok||!json.ok)throw Error('failed');
   await load();
  }catch{setError('La modification a échoué. Aucun avis n’a été modifié.');}
  finally{setBusy('');}
 };
 return <main className="az-review-admin">
  <a href="/admin"><ArrowLeft size={17}/> Retour à l’administration</a>
  <h1>Avis des visiteurs</h1>
  <p>Chaque avis doit être examiné avant d’apparaître sur le site public. Ne publiez pas de données personnelles sensibles.</p>
  {error&&<p role="alert" className="az-review-admin-error">{error}</p>}
  {loading?<p>Chargement…</p>:items.length===0?<p>Aucun avis reçu.</p>:
   <div className="az-review-admin-list">{items.map(item=><article key={item.id}>
    <div className="az-review-admin-head"><strong>{item.name}</strong><span>{item.status==='pending'?'À examiner':item.status==='approved'?'Publié':'Refusé'}</span></div>
    <p>{item.comment}</p>
    <small>{labels[item.source]??'Autre'} · {item.rating===null?'Sans note':item.rating+'/5'} · {new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium'}).format(new Date(item.createdAt))}</small>
    <div className="az-review-admin-actions">
     <button type="button" disabled={busy===item.id||item.status==='approved'} onClick={()=>act(item.id,'approved')}><Check size={16}/> Approuver</button>
     <button type="button" disabled={busy===item.id||item.status==='rejected'} onClick={()=>act(item.id,'rejected')}><Trash2 size={16}/> Refuser / retirer</button>
    </div>
   </article>)}</div>}
 </main>;
}
