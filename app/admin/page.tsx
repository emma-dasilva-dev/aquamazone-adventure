import { redirect } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthenticated } from '../../lib/admin-auth';
import AdminExperienceFields from '../AdminExperienceFields';

export const dynamic='force-dynamic';

type ReservationRow={
  reference:string;experience:string;visit_date:string;requested_time:string;
  adults:number;children:number;quote_amount_xof:number|null;status:string;payment_status:string;
  created_at:string;expires_at:string|null;contact_name:string|null;contact_phone:string|null;
  experience_selection:{activities:string[];package:string|null;choice:string|null}|null;
};
type AlertRow={id:string;event_type:string;channel:string;status:string;attempt_count:number;created_at:string;reference:string};
type CapacityUsageRow={visit_date:string;reservation_count:number;visitor_count:number};
const dateTime=(value:string)=>{const d=new Date(value);return isNaN(d.getTime())?value:new Intl.DateTimeFormat('fr-FR',{timeZone:'Africa/Porto-Novo',dateStyle:'medium',timeStyle:'short'}).format(d);};
const dateOnly=(value:string)=>{const date=String(value).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(date)?date:value;};
const formatMoney=(value:number|null)=>value==null?'À confirmer':new Intl.NumberFormat('fr-FR').format(value)+' FCFA';
const statusLabels:Record<string,string>={
  inquiry:'Demande reçue',pending_review:'À examiner',awaiting_payment:'Paiement attendu',
  confirmed:'Confirmée',cancelled:'Annulée',completed:'Terminée',expired:'Expirée',
  unpaid:'Non payé',pending:'En attente',verified:'Vérifié',failed:'Échec',refunded:'Remboursé',
  accepted:'Acceptée par le fournisseur',retry:'Nouvel essai',sending:'En cours',
  reservation_created:'Nouvelle demande',reservation_status_changed:'Changement de réservation',
  payment_status_changed:'Changement de paiement'
};
const label=(value:string)=>statusLabels[value]||value.replaceAll('_',' ');
const intakeErrorMessages:Record<string,string>={
  not_configured:'La connexion privée de saisie n’est pas configurée.',
  empty:'Choisissez au moins une activité ou un forfait.',
  activities:'Sélection des activités invalide ou activité sélectionnée plusieurs fois.',
  package:'Forfait inconnu. Choisissez un forfait dans la liste.',
  choice:'Pour GLÈLÈ, choisissez le canoë simple ou le pédalo simple.',
  unknown_experience:'Activité ou forfait non reconnu.',
  invalid_date:'La date choisie est invalide.',
  past_date:'La date ne peut pas être dans le passé. Pour une demande ancienne, utilisez le suivi historique lorsqu’il sera disponible.',
  too_soon:'Choisissez une date valide pour cette demande.',
  special_day:'Cette date nécessite une vérification manuelle des conditions d’accueil.',
  invalid_time:'Choisissez un créneau horaire entre 12 h et 17 h.',
  invalid_guests:'Le nombre d’adultes et d’enfants doit être un entier positif ou nul.',
  guest_limit:'Choisissez entre 1 et 20 participants.',
  package_guests:'Participants incompatibles avec le forfait : GLÈLÈ = 1 personne ; GUÉZO = 2 adultes ; TOFFA = 2 adultes et 2 enfants ; BÉHANZIN = 4 adultes.',
  capacity:'Le bateau à pédales accepte actuellement 2 à 4 personnes par demande.',
  activity_choice:'Pour GLÈLÈ, choisissez une seule activité incluse : canoë simple ou pédalo simple.',
  invalid:'Vérifiez le nom, le téléphone et les informations de la demande.',
  database_error:'La demande n’a pas été enregistrée. Vérifiez la connexion de saisie ou contactez l’administratrice.',
  rules:'Vérifiez les activités, le forfait, la date et les participants.'
};

export default async function AdminDashboard({searchParams}:{searchParams:Promise<{intake?:string;hold?:string}>}){
  if(!await isAdminAuthenticated())redirect('/admin/login');
  const params=await searchParams;
  const notice=params.intake;
  const holdNotice=params.hold;
  let reservations:ReservationRow[]=[];
  let alerts:AlertRow[]=[];
  let usage:CapacityUsageRow[]=[];
  let total=0,pending=0,confirmed=0,failedAlerts=0;
  let capacity={dailyVisitors:70,dailyReservations:40,slotVisitors:10};
  let databaseError=false;
  let databaseStep='connection';
  try{
    const url=process.env.DATABASE_URL_READONLY;
    if(!url)throw Error('Database not configured');
    const sql=neon(url);
    databaseStep='reservations_summary';
    const summary=await sql`SELECT
        COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE status IN ('inquiry','pending_review','awaiting_payment'))::integer AS pending,
        COUNT(*) FILTER (WHERE status='confirmed')::integer AS confirmed
        FROM reservations`;
    databaseStep='reservations_list';
    const bookings=await sql`SELECT reference,experience,visit_date::text,requested_time::text,adults,children,
        quote_amount_xof,status,payment_status,contact_name,contact_phone,experience_selection,created_at::text,expires_at::text
        FROM reservations ORDER BY created_at DESC LIMIT 40`;
    databaseStep='notifications_list';
    const notifications=await sql`SELECT o.id::text,o.event_type,o.channel,o.status,o.attempt_count,o.created_at::text,
        r.reference FROM reservation_notification_outbox o
        JOIN reservations r ON r.id=o.reservation_id
        ORDER BY o.created_at DESC LIMIT 40`;
    databaseStep='capacity_policy';
    const policies=await sql`SELECT daily_visitors,daily_reservations,slot_visitors
      FROM reservation_capacity_policy WHERE id=1`;
    if(policies.length!==1)throw Error('Capacity policy missing');
    capacity={
      dailyVisitors:Number(policies[0].daily_visitors),
      dailyReservations:Number(policies[0].daily_reservations),
      slotVisitors:Number(policies[0].slot_visitors)
    };
    databaseStep='capacity_usage';
    const dailyUsage=await sql`SELECT visit_date::text AS visit_date,
      sum(reservation_count)::integer AS reservation_count,
      sum(visitor_count)::integer AS visitor_count
      FROM reservation_capacity_usage
      WHERE visit_date >= (now() AT TIME ZONE 'Africa/Porto-Novo')::date
        AND visit_date <= (now() AT TIME ZONE 'Africa/Porto-Novo')::date + 14
      GROUP BY visit_date ORDER BY visit_date`;
    usage=dailyUsage.map(row=>({
      visit_date:String(row.visit_date),
      reservation_count:Number(row.reservation_count),
      visitor_count:Number(row.visitor_count)
    }));
    databaseStep='transform_results';
    total=Number(summary[0]?.total||0);
    pending=Number(summary[0]?.pending||0);
    confirmed=Number(summary[0]?.confirmed||0);
    reservations=bookings as unknown as ReservationRow[];
    alerts=notifications as unknown as AlertRow[];
    failedAlerts=alerts.filter(row=>row.status==='failed').length;
  }catch(error){
    databaseError=true;
    // Report diagnostics only to the private server log. Never print SQL URLs or credentials.
    console.error('[Aquamazone admin] Query stage failed:',databaseStep,
      error instanceof Error ? error.name : 'UnknownError');
  }
  return <main className="az-admin-shell">
    <header className="az-admin-top">
      <div><strong>AQUAMAZONE <span style={{color:'#0055a4'}}>ADVENTURE</span></strong><small>ESPACE ADMINISTRATEUR · ACCÈS PRIVÉ</small></div>
      <form action="/api/admin/logout" method="post"><button type="submit">Déconnexion</button></form>
    </header>
    <div className="az-admin-head">
      <div><p>VUE D'ENSEMBLE</p><h1>Réservations</h1><p>Demandes, paiements et alertes — une seule interface.</p></div>
      <span className="az-admin-status">Données synchronisées depuis Neon</span>
    </div>
    {databaseError?<div className="az-admin-panel"><p className="az-admin-empty" role="alert">Impossible de charger les données du tableau de bord. Étape : {databaseStep}. Les informations de connexion restent privées.</p></div>:<>
      <section className="az-admin-stats" aria-label="Statistiques">
        <div className="az-admin-stat"><small>Total des demandes</small><strong>{total}</strong></div>
        <div className="az-admin-stat"><small>À traiter</small><strong>{pending}</strong></div>
        <div className="az-admin-stat"><small>Confirmées</small><strong>{confirmed}</strong></div>
        <div className="az-admin-stat"><small>Alertes en échec (40 dernières)</small><strong>{failedAlerts}</strong></div>
      </section>
      <section className="az-admin-panel" aria-labelledby="az-admin-capacity-title">
        <div className="az-admin-panel-header"><h2 id="az-admin-capacity-title">Limites de réservation</h2><p>Politique enregistrée · contrôle administrateur</p></div>
        <div className="az-admin-capacity-grid">
          <div><small>Visiteurs / jour</small><strong>{capacity.dailyVisitors}</strong></div>
          <div><small>Réservations / jour</small><strong>{capacity.dailyReservations}</strong></div>
          <div><small>Visiteurs / créneau</small><strong>{capacity.slotVisitors}</strong></div>
        </div>
        <p className="az-admin-capacity-note">
          Plafonds appliqués dans la base aux réservations confirmées et aux retenues de paiement encore actives.
          Les demandes non confirmées ne bloquent pas de places. Le paiement public reste désactivé.
        </p>
        <div className="az-admin-capacity-usage">
          <h3>Occupation à venir — 14 jours</h3>
          {usage.length===0?<p>Aucune réservation confirmée ni retenue active sur cette période.</p>:
            <div className="az-admin-capacity-usage-list">{usage.map(day=>
              <div key={day.visit_date}>
                <strong>{day.visit_date}</strong>
                <span>{day.visitor_count} / {capacity.dailyVisitors} visiteurs</span>
                <span>{day.reservation_count} / {capacity.dailyReservations} réservations</span>
              </div>)}</div>}
        </div>
      </section>
      <section className="az-admin-panel" aria-labelledby="az-admin-intake-title">
        <div className="az-admin-panel-header"><h2 id="az-admin-intake-title">Enregistrer une demande WhatsApp</h2><p>Une demande en semaine ou pour aujourd'hui peut être enregistrée, sans confirmation de disponibilité</p></div>
        <div className="az-admin-intake-content">
          {notice==='created'&&<p className="az-admin-success" role="status">La demande a été enregistrée. Des notifications email et WhatsApp ont été mises en attente dans la base.</p>}
          {notice && notice!=='created'&&<p className="az-admin-form-error" role="alert">{intakeErrorMessages[notice]||'Enregistrement impossible. Vérifiez les informations et la connexion.'}</p>}
          <form action="/api/admin/reservations" method="post" className="az-admin-intake-form">
            <label>Nom du client<input name="contactName" required maxLength={100} autoComplete="off" placeholder="Nom et prénom"/></label>
            <label>Téléphone du client<input name="contactPhone" required maxLength={24} autoComplete="off" inputMode="tel" placeholder="+229 ..."/></label>
            <AdminExperienceFields/>
            <label>Date de visite<input name="date" type="date" required/></label>
            <label>Heure de départ<select name="time" defaultValue="12:00">{['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
            <label>Adultes<input type="number" name="adults" min={0} max={20} defaultValue={2} required/></label>
            <label>Enfants de moins de 12 ans<input type="number" name="children" min={0} max={20} defaultValue={0} required/></label>
            <div className="az-admin-form-footer"><p>Le client et son paiement restent non vérifiés. Aucune place n'est bloquée et aucun encaissement n'est enregistré.</p><button type="submit">Enregistrer la demande ↗</button></div>
          </form>
        </div>
      </section>
      <section className="az-admin-panel" aria-labelledby="az-admin-res-title">
        <div className="az-admin-panel-header"><h2 id="az-admin-res-title">Dernières réservations</h2><p>40 dernières demandes</p></div>
        {holdNotice&&<p className={holdNotice==='created'?'az-admin-success':'az-admin-form-error'} role="status">
          {holdNotice==='created'?'Retenue de 10 minutes créée. Aucun paiement n’a été demandé ni encaissé.':
           holdNotice==='not_configured'?'La connexion Neon dédiée aux retenues n’est pas configurée (DATABASE_URL_HOLDS).':
           holdNotice==='capacity'?'Le créneau est complet ou le matériel nécessaire est indisponible.':
           holdNotice==='invalid'?'Référence de réservation invalide.':
           'Impossible de créer la retenue. Vérifiez la date, le prix ou les conditions de cette expérience.'}
        </p>}
        {reservations.length===0?<p className="az-admin-empty">Aucune demande enregistrée. Les messages WhatsApp ne sont pas automatiquement importés.</p>:<div className="az-admin-scroll"><table className="az-admin-table">
          <thead><tr><th>Référence</th><th>Client / téléphone</th><th>Expérience</th><th>Date / heure</th><th>Personnes</th><th>Montant</th><th>Réservation</th><th>Paiement</th><th>Retenue interne</th></tr></thead>
          <tbody>{reservations.map(row=><tr key={row.reference}>
            <td><strong>{row.reference}</strong></td><td>{row.contact_name||'—'}<br/><small>{row.contact_phone||'—'}</small></td><td>{row.experience_selection ? <><strong>{row.experience_selection.package ? row.experience_selection.package.toUpperCase() : 'Sans forfait'}</strong><br/><small>{row.experience_selection.activities.length ? row.experience_selection.activities.map(x=>x.toUpperCase()).join(' · ') : 'Aucune activité ajoutée'}{row.experience_selection.package==='glele'&&row.experience_selection.choice ? ' · GLÈLÈ : '+row.experience_selection.choice.toUpperCase():''}</small></> : row.experience.toUpperCase()}</td>
            <td>{dateOnly(row.visit_date)} · {row.requested_time.slice(0,5)}</td>
            <td>{Number(row.adults)+Number(row.children)}</td><td>{formatMoney(row.quote_amount_xof)}</td>
            <td><span className="az-admin-pill" data-status={row.status}>{label(row.status)}</span></td>
            <td><span className="az-admin-pill" data-status={row.payment_status}>{label(row.payment_status)}</span></td>
            <td>{row.status==='awaiting_payment'&&row.expires_at?
              <span className="az-admin-hold-expiry">Retenue jusqu’au {dateTime(row.expires_at)}. Paiement non activé.</span>:
              ['inquiry','pending_review'].includes(row.status)&&Boolean(row.quote_amount_xof)&&
              (row.experience==='glele'&&Number(row.adults)+Number(row.children)===1||
               ['canoe','pedalo'].includes(row.experience)&&Number(row.adults)+Number(row.children)<=2||
               row.experience==='pedalboat'&&Number(row.adults)+Number(row.children)>=2&&Number(row.adults)+Number(row.children)<=4)&&
              !(row.experience_selection&&(
                row.experience_selection.activities.length>1||
                Boolean(row.experience_selection.package&&row.experience_selection.activities.length)))?
              <form action="/api/admin/reservations/hold" method="post">
                <input type="hidden" name="reference" value={row.reference}/>
                <button type="submit" className="az-admin-hold-action">Tester une retenue de 10 min</button>
              </form>:<small>Non applicable</small>}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section className="az-admin-panel" aria-labelledby="az-admin-alert-title">
        <div className="az-admin-panel-header"><h2 id="az-admin-alert-title">Journal des notifications</h2><p>WhatsApp et email · 40 dernières</p></div>
        {alerts.length===0?<p className="az-admin-empty">Aucune alerte enregistrée.</p>:<div className="az-admin-scroll"><table className="az-admin-table">
          <thead><tr><th>Réservation</th><th>Événement</th><th>Canal</th><th>État de l'envoi</th><th>Tentatives</th><th>Date</th></tr></thead>
          <tbody>{alerts.map(row=><tr key={row.id}>
            <td><strong>{row.reference}</strong></td><td>{label(row.event_type)}</td><td>{row.channel==='whatsapp'?'WhatsApp':'Email'}</td>
            <td><span className="az-admin-pill" data-status={row.status}>{label(row.status)}</span></td>
            <td>{row.attempt_count}</td><td>{dateTime(row.created_at)}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </>}
    <p className="az-admin-note">Une demande reçue ne garantit ni disponibilité ni paiement. Une retenue est temporaire et ne constitue pas une confirmation ; son expiration libère la capacité. Aucun paiement en ligne n’est actif. Actualisez cette page pour voir les dernières données.</p>
  </main>;
}
