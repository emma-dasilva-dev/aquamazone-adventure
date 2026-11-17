import { redirect } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthenticated } from '../../lib/admin-auth';

export const dynamic='force-dynamic';

type ReservationRow={
  reference:string;experience:string;visit_date:string;requested_time:string;
  adults:number;children:number;quote_amount_xof:number|null;status:string;payment_status:string;
  created_at:string;
};
type AlertRow={id:string;event_type:string;channel:string;status:string;attempt_count:number;created_at:string;reference:string};
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

export default async function AdminDashboard(){
  if(!await isAdminAuthenticated())redirect('/admin/login');
  let reservations:ReservationRow[]=[];
  let alerts:AlertRow[]=[];
  let total=0,pending=0,confirmed=0,failedAlerts=0;
  let databaseError=false;
  try{
    const url=process.env.DATABASE_URL_READONLY;
    if(!url)throw Error('Database not configured');
    const sql=neon(url);
    const [summary,bookings,notifications]=await Promise.all([
      sql`SELECT
        COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE status IN ('inquiry','pending_review','awaiting_payment'))::integer AS pending,
        COUNT(*) FILTER (WHERE status='confirmed')::integer AS confirmed
        FROM reservations`,
      sql`SELECT reference,experience,visit_date::text,requested_time::text,adults,children,
        quote_amount_xof,status,payment_status,created_at::text
        FROM reservations ORDER BY created_at DESC LIMIT 40`,
      sql`SELECT o.id::text,o.event_type,o.channel,o.status,o.attempt_count,o.created_at::text,
        r.reference FROM reservation_notification_outbox o
        JOIN reservations r ON r.id=o.reservation_id
        ORDER BY o.created_at DESC LIMIT 40`
    ]);
    total=Number(summary[0]?.total||0);
    pending=Number(summary[0]?.pending||0);
    confirmed=Number(summary[0]?.confirmed||0);
    reservations=bookings as unknown as ReservationRow[];
    alerts=notifications as unknown as AlertRow[];
    failedAlerts=alerts.filter(row=>row.status==='failed').length;
  }catch{databaseError=true;}
  return <main className="az-admin-shell">
    <header className="az-admin-top">
      <div><strong>AQUAMAZONE <span style={{color:'#0055a4'}}>ADVENTURE</span></strong><small>ESPACE ADMINISTRATEUR · ACCÈS PRIVÉ</small></div>
      <form action="/api/admin/logout" method="post"><button type="submit">Déconnexion</button></form>
    </header>
    <div className="az-admin-head">
      <div><p>VUE D'ENSEMBLE</p><h1>Réservations</h1><p>Demandes, paiements et alertes — une seule interface.</p></div>
      <span className="az-admin-status">Données de la base Neon · lecture seule</span>
    </div>
    {databaseError?<div className="az-admin-panel"><p className="az-admin-empty" role="alert">La base de données ou les tables d'alertes sont indisponibles. Vérifiez la configuration et la migration 0003.</p></div>:<>
      <section className="az-admin-stats" aria-label="Statistiques">
        <div className="az-admin-stat"><small>Total des demandes</small><strong>{total}</strong></div>
        <div className="az-admin-stat"><small>À traiter</small><strong>{pending}</strong></div>
        <div className="az-admin-stat"><small>Confirmées</small><strong>{confirmed}</strong></div>
        <div className="az-admin-stat"><small>Alertes en échec (40 dernières)</small><strong>{failedAlerts}</strong></div>
      </section>
      <section className="az-admin-panel" aria-labelledby="az-admin-res-title">
        <div className="az-admin-panel-header"><h2 id="az-admin-res-title">Dernières réservations</h2><p>40 dernières demandes</p></div>
        {reservations.length===0?<p className="az-admin-empty">Aucune demande enregistrée. Les messages WhatsApp ne sont pas automatiquement importés.</p>:<div className="az-admin-scroll"><table className="az-admin-table">
          <thead><tr><th>Référence</th><th>Expérience</th><th>Date / heure</th><th>Personnes</th><th>Montant</th><th>Réservation</th><th>Paiement</th></tr></thead>
          <tbody>{reservations.map(row=><tr key={row.reference}>
            <td><strong>{row.reference}</strong></td><td>{row.experience.toUpperCase()}</td>
            <td>{dateOnly(row.visit_date)} · {row.requested_time.slice(0,5)}</td>
            <td>{Number(row.adults)+Number(row.children)}</td><td>{formatMoney(row.quote_amount_xof)}</td>
            <td><span className="az-admin-pill" data-status={row.status}>{label(row.status)}</span></td>
            <td><span className="az-admin-pill" data-status={row.payment_status}>{label(row.payment_status)}</span></td>
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
    <p className="az-admin-note">Une demande reçue ne garantit ni disponibilité ni paiement. Seule une vérification indépendante du paiement permettra une confirmation ultérieure. Actualisez cette page pour voir les dernières données.</p>
  </main>;
}
