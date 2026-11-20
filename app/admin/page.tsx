import { redirect } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { isAdminAuthenticated } from '../../lib/admin-auth';
import AdminExperienceFields from '../AdminExperienceFields';
import {ArrowUpRight,CalendarDays,CreditCard,LayoutDashboard,MessageCircle,ShieldCheck,Users,AlertCircle,ClipboardList,Star,Wallet,Activity} from 'lucide-react';

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
  choice:'Pour GLÈLÈ, choisissez le canoë-kayak simple, le pédalo simple ou le paddle/stand-up.',
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
  activity_choice:'Pour GLÈLÈ, choisissez une seule activité incluse : canoë-kayak simple, pédalo simple ou paddle/stand-up.',
  invalid:'Vérifiez le nom, le téléphone et les informations de la demande.',
  database_error:'La demande n’a pas été enregistrée. Vérifiez la connexion de saisie ou contactez l’administratrice.',
  rules:'Vérifiez les activités, le forfait, la date et les participants.'
};

export default async function AdminDashboard({searchParams}:{searchParams:Promise<{intake?:string;hold?:string;status?:string}>}){
  if(!await isAdminAuthenticated())redirect('/admin/login');
  const params=await searchParams;
  const notice=params.intake;
  const holdNotice=params.hold;
  const statusNotice=params.status;
  let reservations:ReservationRow[]=[];
  let alerts:AlertRow[]=[];
  let usage:CapacityUsageRow[]=[];
  let total=0,pending=0,confirmed=0,failedAlerts=0;
  let paymentPending=0,paymentVerified=0,paymentFailed=0;
  const momoConfigured=process.env.MTN_MOMO_ENABLED==='true' && Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY&&process.env.MTN_MOMO_API_USER&&process.env.MTN_MOMO_API_KEY);
  const momoProduction=momoConfigured&&process.env.MTN_MOMO_ENVIRONMENT==='mtnbenin';
  let capacity={dailyVisitors:70,dailyReservations:40,slotVisitors:10};
  let weekly={visitors:0,reservations:0,start:'',end:''};
  let todayCapacity={visitors:0,reservations:0,slotVisitors:0};
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
        COUNT(*) FILTER (WHERE status='confirmed')::integer AS confirmed,
        COUNT(*) FILTER (WHERE payment_status='pending')::integer AS payment_pending,
        COUNT(*) FILTER (WHERE payment_status='verified')::integer AS payment_verified,
        COUNT(*) FILTER (WHERE payment_status='failed')::integer AS payment_failed
        FROM reservations`;
    databaseStep='reservations_list';
    const bookings=await sql`SELECT reference,experience,visit_date::text,requested_time::text,adults,children,
        quote_amount_xof,CASE WHEN status='awaiting_payment' AND expires_at<=now() THEN 'expired' ELSE status END AS status,payment_status,contact_name,contact_phone,experience_selection,created_at::text,expires_at::text
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
    databaseStep='weekly_usage';
    const weeklyRows=await sql`
      WITH bounds AS (
        SELECT ((now() AT TIME ZONE 'Africa/Porto-Novo')::date -
          EXTRACT(DOW FROM (now() AT TIME ZONE 'Africa/Porto-Novo')::date)::integer) AS week_start,
          (now() AT TIME ZONE 'Africa/Porto-Novo')::date AS today
      )
      SELECT bounds.week_start::text AS week_start,
             (bounds.week_start+6)::text AS week_end,
             COALESCE(SUM(u.reservation_count) FILTER
              (WHERE u.visit_date>=bounds.week_start AND u.visit_date<bounds.week_start+7),0)::integer AS weekly_reservations,
             COALESCE(SUM(u.visitor_count) FILTER
              (WHERE u.visit_date>=bounds.week_start AND u.visit_date<bounds.week_start+7),0)::integer AS weekly_visitors,
             COALESCE(SUM(u.reservation_count) FILTER
              (WHERE u.visit_date=bounds.today),0)::integer AS today_reservations,
             COALESCE(SUM(u.visitor_count) FILTER
              (WHERE u.visit_date=bounds.today),0)::integer AS today_visitors
      FROM bounds LEFT JOIN reservation_capacity_usage u ON
        u.visit_date>=bounds.week_start AND u.visit_date<bounds.week_start+7
      GROUP BY bounds.week_start
    `;
    if(weeklyRows.length===1){
      weekly={visitors:Number(weeklyRows[0].weekly_visitors),reservations:Number(weeklyRows[0].weekly_reservations),
        start:String(weeklyRows[0].week_start),end:String(weeklyRows[0].week_end)};
      todayCapacity={visitors:Number(weeklyRows[0].today_visitors),reservations:Number(weeklyRows[0].today_reservations),slotVisitors:0};
    }
    databaseStep='transform_results';
    total=Number(summary[0]?.total||0);
    pending=Number(summary[0]?.pending||0);
    confirmed=Number(summary[0]?.confirmed||0);
    reservations=bookings as unknown as ReservationRow[];
    alerts=notifications as unknown as AlertRow[];
    failedAlerts=alerts.filter(row=>row.status==='failed').length;
    paymentPending=Number(summary[0]?.payment_pending||0);
    paymentVerified=Number(summary[0]?.payment_verified||0);
    paymentFailed=Number(summary[0]?.payment_failed||0);
  }catch(error){
    databaseError=true;
    // Report diagnostics only to the private server log. Never print SQL URLs or credentials.
    console.error('[Aquamazone admin] Query stage failed:',databaseStep,
      error instanceof Error ? error.name : 'UnknownError');
  }
  return <main className="az-admin-shell">
    <header className="az-admin-top">
      <a href="/admin" className="az-admin-brand" aria-label="Aquamazone Adventure — Administration">
        <span className="az-admin-brand-mark">A</span>
        <span><strong>AQUAMAZONE <em>ADVENTURE</em></strong><small>ESPACE DE GESTION</small></span>
      </a>
      <div className="az-admin-top-actions">
        <a className="az-admin-website" href="/" target="_blank" rel="noopener noreferrer">Voir le site <ArrowUpRight size={15}/></a>
        <form action="/api/admin/logout" method="post"><button type="submit">Déconnexion</button></form>
      </div>
    </header>
    <nav className="az-admin-nav" aria-label="Navigation de l’administration">
      <a href="#overview"><LayoutDashboard size={16}/> Vue d’ensemble</a>
      <a href="#reservations"><ClipboardList size={16}/> Réservations</a>
      <a href="#payments"><CreditCard size={16}/> Paiements</a>
      <a href="#intake"><MessageCircle size={16}/> Saisie manuelle</a>
      <a href="#capacity"><Users size={16}/> Capacité</a>
      <a href="/admin/reviews"><Star size={16}/> Avis clients</a>
      <a href="#notifications"><Activity size={16}/> Notifications</a>
    </nav>
    <div id="overview" className="az-admin-head">
      <div><p className="az-admin-overline">TABLEAU DE BORD · AQUAMAZONE</p><h1>Vue d’ensemble</h1><p>Suivez les demandes, préparez les visites et surveillez les paiements.</p></div>
      <span className="az-admin-status"><span className="az-admin-status-dot"/> {databaseError?'Données indisponibles':'Données de la base Neon'}</span>
    </div>
    {databaseError?<div className="az-admin-panel"><p className="az-admin-empty" role="alert">Impossible de charger les données du tableau de bord. Étape : {databaseStep}. Les informations de connexion restent privées.</p></div>:<>
      <section className="az-admin-stats" aria-label="Indicateurs clés">
        <a className="az-admin-stat" href="#reservations"><span className="az-admin-stat-top"><small>Demandes à traiter</small><ClipboardList size={19}/></span><strong>{pending}</strong><span className="az-admin-stat-caption">En attente d’une action</span></a>
        <a className="az-admin-stat" href="#reservations"><span className="az-admin-stat-top"><small>Réservations confirmées</small><CalendarDays size={19}/></span><strong>{confirmed}</strong><span className="az-admin-stat-caption">Toutes dates confondues</span></a>
        <a className="az-admin-stat" href="#payments"><span className="az-admin-stat-top"><small>Paiements en attente</small><Wallet size={19}/></span><strong>{paymentPending}</strong><span className="az-admin-stat-caption">États enregistrés en base</span></a>
        <a className="az-admin-stat" href="#notifications"><span className="az-admin-stat-top"><small>Alertes en échec</small><AlertCircle size={19}/></span><strong>{failedAlerts}</strong><span className="az-admin-stat-caption">Sur les 40 derniers envois</span></a>
      </section>
      <div className="az-admin-primary-grid">
        <section className="az-admin-priority" aria-labelledby="az-admin-priority-title">
          <div className="az-admin-priority-heading"><div><span>À FAIRE</span><h2 id="az-admin-priority-title">Priorités du moment</h2></div><a href="#reservations">Voir les demandes <ArrowUpRight size={16}/></a></div>
          <div className="az-admin-priority-list">
            <a href="#reservations"><span className="az-admin-priority-icon"><ClipboardList size={18}/></span><span><strong>{pending} demande{pending===1?'':'s'} à examiner</strong><small>Vérifier les visiteurs, l’activité et les disponibilités</small></span><ArrowUpRight size={16}/></a>
            <a href="#payments"><span className="az-admin-priority-icon"><CreditCard size={18}/></span><span><strong>{paymentPending} paiement{paymentPending===1?'':'s'} en attente</strong><small>Ne pas valider manuellement un paiement non vérifié</small></span><ArrowUpRight size={16}/></a>
            <a href="#notifications"><span className="az-admin-priority-icon"><AlertCircle size={18}/></span><span><strong>{failedAlerts} notification{failedAlerts===1?'':'s'} en échec</strong><small>Contrôler les tentatives de contact échouées</small></span><ArrowUpRight size={16}/></a>
          </div>
        </section>
        <section className="az-admin-momo-card" aria-labelledby="az-admin-momo-title">
          <span className="az-admin-momo-overline"><ShieldCheck size={17}/> PAIEMENTS</span>
          <h2 id="az-admin-momo-title">MTN Mobile Money</h2>
          <p className="az-admin-momo-state">{momoProduction?'Configuration technique de production détectée':momoConfigured?'Environnement de test / configuration incomplète':'Intégration non activée'}</p>
          <p>{momoProduction?'La présence des identifiants ne garantit pas que le paiement et sa réconciliation soient opérationnels. Aucun encaissement ne peut être déclenché depuis ce tableau de bord.':'Le paiement en ligne n’est pas encore disponible pour les visiteurs. Le tableau de bord prépare le suivi des transactions sans simuler d’encaissement.'}</p>
          <a href="#payments">Consulter le suivi <ArrowUpRight size={17}/></a>
        </section>
      </div>
      <section id="reservations" className="az-admin-panel" aria-labelledby="az-admin-res-title">
        <div className="az-admin-panel-header">
          <div><span className="az-admin-section-eyebrow">SUIVI DES DEMANDES</span><h2 id="az-admin-res-title">Réservations</h2></div>
          <p>40 derniers dossiers · WhatsApp / saisie manuelle</p>
        </div>
        {holdNotice&&<p className={holdNotice==='created'?'az-admin-success':'az-admin-form-error'} role="status">
          {holdNotice==='created'?'Retenue de 10 minutes créée. Aucun paiement n’a été demandé ni encaissé.':
           holdNotice==='not_configured'?'La connexion Neon dédiée aux retenues n’est pas configurée (DATABASE_URL_HOLDS).':
           holdNotice==='capacity'?'Le créneau est complet ou le matériel nécessaire est indisponible.':
           holdNotice==='invalid'?'Référence de réservation invalide.':
           'Impossible de créer la retenue. Vérifiez la date, le prix ou les conditions de cette expérience.'}
        </p>}
        {statusNotice&&<p className={statusNotice==='updated'?'az-admin-success':'az-admin-form-error'} role="status">
          {statusNotice==='updated'?'Statut de la réservation mis à jour.':
           statusNotice==='transition'?'Cette évolution de statut n’est pas autorisée.':
           statusNotice==='not_found'?'Réservation introuvable.':
           statusNotice==='not_configured'?'La connexion privée de gestion n’est pas configurée.':
           statusNotice==='invalid'?'Action de réservation invalide.':
           'Impossible de mettre à jour la réservation. Vérifiez la connexion à la base.'}
        </p>}
        {reservations.length===0?<p className="az-admin-empty">Aucune demande enregistrée. Les messages WhatsApp ne sont pas automatiquement importés.</p>:<div className="az-admin-scroll"><table className="az-admin-table">
          <thead><tr><th>Client</th><th>Date</th><th>Heure</th><th>Personnes</th><th>Expérience</th><th>Total</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>{reservations.map(row=><tr key={row.reference}>
            <td><strong>{row.contact_name||'—'}</strong><br/><small>{row.contact_phone||'—'}</small></td>
            <td>{dateOnly(row.visit_date)}</td>
            <td>{row.requested_time.slice(0,5)}</td>
            <td>{Number(row.adults)+Number(row.children)}<br/><small>{row.adults} ad. · {row.children} enf.</small></td>
            <td><strong>{row.experience_selection?.package ? row.experience_selection.package.toUpperCase() : row.experience.toUpperCase()}</strong><br/>
              <small>{row.experience_selection?.activities.length ? row.experience_selection.activities.map(x=>x.toUpperCase()).join(' · ') : 'Forfait / détail'}</small>
              <details className="az-admin-details"><summary>Détails</summary>
                <div className="az-admin-details-body">
                  <p><strong>Référence</strong> {row.reference}</p>
                  <p><strong>Contact</strong> {row.contact_name||'—'} · {row.contact_phone||'—'}</p>
                  <p><strong>Participants</strong> {row.adults} adulte(s) · {row.children} enfant(s)</p>
                  <p><strong>Expérience</strong> {row.experience_selection ? (row.experience_selection.package ? row.experience_selection.package.toUpperCase()+' · ' : '') + (row.experience_selection.activities.map(x=>x.toUpperCase()).join(' · ') || 'Forfait') : row.experience.toUpperCase()}</p>
                  {row.experience_selection?.package==='glele'&&row.experience_selection.choice?<p><strong>Choix GLÈLÈ</strong> {row.experience_selection.choice.toUpperCase()}</p>:''}
                  <p><strong>Montant estimé</strong> {formatMoney(row.quote_amount_xof)}</p>
                  <p><strong>Paiement</strong> <span className="az-admin-pill" data-status={row.payment_status}>{label(row.payment_status)}</span></p>
                  {row.status==='awaiting_payment'&&row.expires_at?<p><strong>Retenue interne</strong> Retenue jusqu’au {dateTime(row.expires_at)}. Aucun paiement lancé.</p>:''}
                </div>
              </details>
            </td>
            <td>{formatMoney(row.quote_amount_xof)}</td>
            <td><span className="az-admin-pill" data-status={row.status}>{label(row.status)}</span></td>
            <td>
              {row.status==='inquiry'?<form action="/api/admin/reservations/status" method="post"><input type="hidden" name="reference" value={row.reference}/><input type="hidden" name="status" value="pending_review"/><button type="submit" className="az-admin-action">Examiner</button></form>:''}
              {row.status==='pending_review'?<div className="az-admin-actions"><form action="/api/admin/reservations/status" method="post"><input type="hidden" name="reference" value={row.reference}/><input type="hidden" name="status" value="confirmed"/><button type="submit" className="az-admin-action">Confirmer</button></form><form action="/api/admin/reservations/status" method="post"><input type="hidden" name="reference" value={row.reference}/><input type="hidden" name="status" value="cancelled"/><button type="submit" className="az-admin-action az-admin-action-secondary">Annuler</button></form></div>:''}
              {row.status==='confirmed'?<div className="az-admin-actions"><form action="/api/admin/reservations/status" method="post"><input type="hidden" name="reference" value={row.reference}/><input type="hidden" name="status" value="completed"/><button type="submit" className="az-admin-action">Terminée</button></form><form action="/api/admin/reservations/status" method="post"><input type="hidden" name="reference" value={row.reference}/><input type="hidden" name="status" value="cancelled"/><button type="submit" className="az-admin-action az-admin-action-secondary">Annuler</button></form></div>:''}
              {['cancelled','completed','awaiting_payment','expired'].includes(row.status)?<small>—</small>:''}
            </td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section id="payments" className="az-admin-panel az-admin-payment-panel" aria-labelledby="az-admin-pay-title">
        <div className="az-admin-panel-header"><div><span className="az-admin-section-eyebrow">GESTION DES TRANSACTIONS</span><h2 id="az-admin-pay-title">Suivi des paiements</h2></div><p>États enregistrés · aucun paiement initié ici</p></div>
        <div className="az-admin-payment-metrics">
          <div><small>En attente</small><strong>{paymentPending}</strong><span>À vérifier auprès du prestataire</span></div>
          <div><small>Vérifiés en base</small><strong>{paymentVerified}</strong><span>Selon les enregistrements existants</span></div>
          <div><small>Échecs enregistrés</small><strong>{paymentFailed}</strong><span>À examiner si nécessaire</span></div>
        </div>
        <div className="az-admin-payment-state"><ShieldCheck size={22}/><p><strong>{momoProduction?'Configuration MTN MoMo détectée':'MTN MoMo : activation en attente'}</strong><br/>Les statuts ci-dessus proviennent de la table des réservations. Ils ne constituent pas un rapport de rapprochement financier MTN. Le paiement en ligne, les remboursements et la synchronisation des transactions restent désactivés jusqu’à l’intégration officielle et sa vérification.</p></div>
        <div className="az-admin-payment-ledger">
          <div className="az-admin-payment-ledger-heading"><h3>Derniers dossiers avec statut de paiement</h3><span>Liste des 40 dernières réservations uniquement</span></div>
          {reservations.filter(row=>row.payment_status!=='unpaid').length===0?
            <p className="az-admin-payment-ledger-empty">Aucun statut de paiement enregistré dans les dernières demandes. Aucun encaissement n’est déduit des devis.</p>:
            <div className="az-admin-scroll"><table className="az-admin-table">
              <thead><tr><th>Référence</th><th>Client</th><th>Montant indiqué</th><th>Statut enregistré</th><th>Créé le</th></tr></thead>
              <tbody>{reservations.filter(row=>row.payment_status!=='unpaid').map(row=><tr key={row.reference}>
                <td><strong>{row.reference}</strong></td><td>{row.contact_name||'—'}</td>
                <td>{formatMoney(row.quote_amount_xof)}</td>
                <td><span className="az-admin-pill" data-status={row.payment_status}>{label(row.payment_status)}</span></td>
                <td>{dateTime(row.created_at)}</td>
              </tr>)}</tbody>
            </table></div>}
        </div>
      </section>
      <section id="capacity" className="az-admin-panel az-capacity-panel" aria-labelledby="az-admin-capacity-title">
        <div className="az-admin-panel-header">
          <div><span className="az-admin-section-eyebrow">CAPACITÉ & SUIVI</span><h2 id="az-admin-capacity-title">Places disponibles</h2></div>
          <p>Semaine du {dateOnly(weekly.start)} au {dateOnly(weekly.end)}</p>
        </div>
        <div className="az-capacity-focus">
          <div className="az-capacity-focus-label"><strong>Comptage de la semaine</strong><span>Le compteur d’activité se réinitialise chaque dimanche à 00h00 · heure du Bénin. Les réservations historiques restent conservées.</span></div>
          <div className="az-capacity-kpis">
            <div><small>Visiteurs engagés cette semaine</small><strong>{weekly.visitors}<span> visiteurs</span></strong><div className="az-capacity-progress" role="progressbar" aria-label="Visiteurs engagés cette semaine" aria-valuemin={0} aria-valuemax={weekly.visitors||1} aria-valuenow={weekly.visitors}><span style={{width:'100%'}}/></div><p>Réservations confirmées / retenues actives de cette semaine</p></div>
            <div><small>Réservations engagées cette semaine</small><strong>{weekly.reservations}<span> dossiers</span></strong><div className="az-capacity-progress" role="progressbar" aria-label="Réservations engagées cette semaine" aria-valuemin={0} aria-valuemax={weekly.reservations||1} aria-valuenow={weekly.reservations}><span style={{width:'100%'}}/></div><p>Le plafond reste appliqué par journée et par créneau.</p></div>
          </div>
        </div>
        <div className="az-capacity-daily">
          <div><strong>Aujourd’hui</strong><span>{Math.max(0,capacity.dailyVisitors-todayCapacity.visitors)} / {capacity.dailyVisitors} visiteurs disponibles</span><span>{Math.max(0,capacity.dailyReservations-todayCapacity.reservations)} / {capacity.dailyReservations} réservations disponibles</span></div>
          <div><strong>Par créneau</strong><span>Maximum {capacity.slotVisitors} visiteurs à la même heure</span><span>Les disponibilités varient selon le créneau choisi</span></div>
        </div>
        <p className="az-admin-capacity-note">Seules les réservations <strong>confirmées</strong> et les retenues de paiement <strong>encore actives</strong> diminuent les places restantes. Une demande WhatsApp non confirmée ne bloque rien. Les limites quotidiennes et par créneau restent appliquées pour éviter les surréservations. Les réservations futures sont comptées dans leur propre semaine, sans suppression de l’historique.</p>
        <div className="az-admin-capacity-usage">
          <h3>Occupation à venir — 14 jours</h3>
          {usage.length===0?<p>Aucune réservation confirmée ni retenue active sur cette période.</p>:
            <div className="az-admin-capacity-usage-list">{usage.map(day=>
              <div key={day.visit_date}>
                <strong>{dateOnly(day.visit_date)}</strong>
                <span>{Math.max(0,capacity.dailyVisitors-day.visitor_count)} / {capacity.dailyVisitors} places restantes</span>
                <span>{Math.max(0,capacity.dailyReservations-day.reservation_count)} / {capacity.dailyReservations} réservations restantes</span>
              </div>)}</div>}
        </div>
      </section>
      <section id="intake" className="az-admin-panel az-intake-panel" aria-labelledby="az-admin-intake-title">
        <div className="az-admin-panel-header">
          <div><span className="az-admin-section-eyebrow">RÉSERVATION MANUELLE</span><h2 id="az-admin-intake-title">Nouvelle demande WhatsApp</h2></div>
          <p>Enregistrez une demande reçue par téléphone ou WhatsApp</p>
        </div>
        <div className="az-admin-intake-content">
          {notice==='created'&&<p className="az-admin-success" role="status">Demande enregistrée. Elle reste à confirmer ; aucune place ni paiement n’a été bloqué.</p>}
          {notice && notice!=='created'&&<p className="az-admin-form-error" role="alert">{intakeErrorMessages[notice]||'Enregistrement impossible. Vérifiez les informations et la connexion.'}</p>}
          <form action="/api/admin/reservations" method="post" className="az-admin-intake-form">
            <div className="az-intake-form-lead">
              <span>DEMANDE NON CONFIRMÉE</span>
              <h3>Préparez la visite en quelques étapes.</h3>
              <p>Complétez les informations ci-dessous. L’enregistrement ne confirme ni disponibilité ni encaissement.</p>
            </div>
            <div className="az-intake-contact">
              <div className="az-intake-section-head"><span className="az-intake-step">01</span><div><h3>Coordonnées du client</h3><p>Informations pour retrouver et contacter le demandeur.</p></div></div>
              <div className="az-intake-contact-fields">
                <label>Nom du client<input name="contactName" required maxLength={100} autoComplete="off" placeholder="Nom et prénom"/></label>
                <label>Numéro WhatsApp / téléphone<input name="contactPhone" required maxLength={24} autoComplete="off" inputMode="tel" placeholder="+229 01 ..."/></label>
              </div>
            </div>
            <AdminExperienceFields/>
            <div className="az-intake-schedule">
              <div className="az-intake-section-head"><span className="az-intake-step">04</span><div><h3>Date et heure</h3><p>Arrivée souhaitée du client.</p></div></div>
              <div className="az-intake-contact-fields">
                <label>Date de visite<input name="date" type="date" required/></label>
                <label>Heure d’arrivée<select name="time" defaultValue="12:00">{['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(x=><option value={x} key={x}>{x}</option>)}</select></label>
              </div>
            </div>
            <div className="az-admin-form-footer"><p>Aucune place n’est bloquée et aucun paiement n’est enregistré avant validation par l’équipe.</p><button type="submit">Enregistrer la demande <ArrowUpRight size={18}/></button></div>
          </form>
        </div>
      </section>
      <section id="notifications" className="az-admin-panel" aria-labelledby="az-admin-alert-title">
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
    <p className="az-admin-note">Les données affichées proviennent de Neon. Une demande n’est jamais une réservation confirmée ; une retenue de capacité ne constitue pas un paiement. Actualisez la page pour consulter les dernières modifications. Les encaissements MTN ne sont pas actifs.</p>
  </main>;
}
