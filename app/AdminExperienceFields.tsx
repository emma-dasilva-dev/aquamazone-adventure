'use client';

import {useState} from 'react';
import {ADMIN_ACTIVITIES,ADMIN_PACKAGES,type AdminActivity,type AdminPackage} from '../lib/admin-experience-selection';

const activityLabels:Record<AdminActivity,string>={
  pedalo:'Pédalo',canoe:'Canoë / Kayak',paddle:'Paddle / Stand Up',
  waterball:'Bulle gonflable',pedalboat:'Bateau à pédales',
  lake:'Balade sur le lac',mangrove:'Découverte des mangroves'
};
const packageLabels:Record<AdminPackage,string>={
  glele:'GLÈLÈ — Solo',guezo:'GUÉZO — Couple',
  toffa:'TOFFA — Famille',behanzin:'BÉHANZIN — Groupe'
};

export default function AdminExperienceFields(){
  const [selectedPackage,setSelectedPackage]=useState('');
  const [activities,setActivities]=useState<AdminActivity[]>([]);
  function toggle(id:AdminActivity,checked:boolean){
    setActivities(previous=>checked?[...previous,id]:previous.filter(value=>value!==id));
  }
  return <div className="az-admin-experience-groups">
    <fieldset className="az-admin-experience-group">
      <legend>Expériences — Activités</legend>
      <p>Choisissez une ou plusieurs activités, ou aucune si vous enregistrez uniquement un forfait.</p>
      <div className="az-admin-activity-grid">
        {ADMIN_ACTIVITIES.map(id=><label key={id} className="az-admin-activity-choice">
          <input name="activities" type="checkbox" value={id} checked={activities.includes(id)}
            onChange={event=>toggle(id,event.target.checked)}/>
          <span>{activityLabels[id]}</span>
        </label>)}
      </div>
    </fieldset>
    <fieldset className="az-admin-experience-group">
      <legend>Expériences — Forfaits</legend>
      <p>Un forfait est facultatif. Si vous n'en choisissez pas, seules les activités sélectionnées seront enregistrées.</p>
      <label className="az-admin-package-field">Forfait
        <select name="package" value={selectedPackage} onChange={event=>setSelectedPackage(event.target.value)}>
          <option value="">Aucun forfait</option>
          {ADMIN_PACKAGES.map(id=><option value={id} key={id}>{packageLabels[id]}</option>)}
        </select>
      </label>
      {selectedPackage==='glele'&&<label className="az-admin-package-field">Activité incluse dans GLÈLÈ (une seule au choix)
        <select name="choice" defaultValue="canoe">
          <option value="canoe">Canoë simple</option>
          <option value="pedalo">Pédalo simple</option>
        </select>
      </label>}
    </fieldset>
    <p className="az-admin-selection-note" role="status">
      {activities.length} activité{activities.length>1?'s':''} sélectionnée{activities.length>1?'s':''}
      {selectedPackage?' · 1 forfait':' · aucun forfait'}
      {activities.length===0&&!selectedPackage?' — choisissez au moins une expérience.':''}
    </p>
  </div>;
}
