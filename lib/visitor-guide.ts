import { businessKnowledge as kb } from './aquamazone-knowledge';

export type VisitorLanguage = 'fr' | 'en';
export type VisitorTurn = { role: 'user' | 'assistant'; content: string };
export type GuideResult = { reply: string; matched: boolean };

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

type Topic = { keys: string[]; fr: string; en: string; priority?: number };
const topics: Topic[] = [
  { keys: ['jet ski','jetski'], priority: 12,
    fr: 'Le jet-ski est actuellement indisponible pour maintenance. Il ne peut pas être réservé.',
    en: 'Jet skiing is currently unavailable due to maintenance. It cannot be booked.' },
  { keys: ['toffa','famille','family package'], priority: 11,
    fr: 'TOFFA est notre forfait famille pour 2 adultes et 2 enfants. Le tarif et les modalités exactes doivent être reconfirmés auprès de notre équipe sur WhatsApp avant réservation.',
    en: 'TOFFA is our family package for 2 adults and 2 children. Please confirm its current price and exact inclusions with our WhatsApp team before booking.' },
  { keys: ['glele','solo'], priority: 10,
    fr: 'Le forfait GLÈLÈ (solo) coûte 5 000 FCFA par adulte ou 3 500 FCFA par enfant. Il comprend la traversée aller-retour et UNE activité au choix : canoë simple OU pédalo simple, pendant 30 minutes.',
    en: 'The GLÈLÈ solo package costs 5,000 FCFA per adult or 3,500 FCFA per child. It includes the return crossing and ONE activity of your choice: a single canoe OR single pedal boat for 30 minutes.' },
  { keys: ['guezo','couple'], priority: 10,
    fr: 'GUÉZO est notre forfait couple à 12 000 FCFA pour 2 personnes. Il comprend la traversée aller-retour, le canoë double, le pédalo double et de l’eau offerte.',
    en: 'GUÉZO is our couple package for 12,000 FCFA for 2 people. It includes the return crossing, a double canoe, a double pedal boat and complimentary water.' },
  { keys: ['behanzin','vip'], priority: 10,
    fr: 'BÉHANZIN est notre forfait groupe pour 4 adultes à 36 000 FCFA. Il comprend la traversée aller-retour, canoë double, balade sur le lac, pédalo et eau offerte. Vérifiez les modalités avec notre équipe.',
    en: 'BÉHANZIN is our group package for 4 adults at 36,000 FCFA. It includes return crossing, double canoe, lake outing, pedal boat and complimentary water. Please confirm arrangements with our team.' },
  { keys: ['bateau a pedales','pedal powered boat','pedal powered','grand bateau'], priority: 9,
    fr: 'Le bateau à pédales dure 30 minutes : 5 000 FCFA par personne pour 2 participants, ou 3 000 FCFA par personne à partir de 3 participants. Chaque bateau accueille au maximum 4 passagers.',
    en: 'The pedal-powered boat lasts 30 minutes: 5,000 FCFA per person for 2 people, or 3,000 FCFA per person for 3 or more. Each boat holds up to 4 passengers.' },
  { keys: ['mangrove','balade sur le lac','lake tour','lake outing','lake cruise'], priority: 9,
    fr: 'Nous proposons des balades sur le lac et la découverte des mangroves. Les tarifs doivent être confirmés auprès de notre équipe avant votre venue.',
    en: 'We offer lake outings and mangrove discovery. Please confirm the current rates with our team before visiting.' },
  { keys: ['water ball','bulle','inflatable ball'], priority: 9,
    fr: 'La bulle gonflable (Water Ball) coûte 3 000 FCFA par personne pour 20 minutes.',
    en: 'The inflatable Water Ball costs 3,000 FCFA per person for 20 minutes.' },
  { keys: ['paddle','stand up'], priority: 8,
    fr: 'Le paddle / stand-up paddle dure 30 minutes et coûte 3 000 FCFA par personne.',
    en: 'Stand-up paddle lasts 30 minutes and costs 3,000 FCFA per person.' },
  { keys: ['canoe','kayak'], priority: 8,
    fr: 'Le canoë-kayak dure 30 minutes et coûte 3 000 FCFA par personne.',
    en: 'Canoe-kayak lasts 30 minutes and costs 3,000 FCFA per person.' },
  { keys: ['pedalo','pedal boat'], priority: 8,
    fr: 'Le pédalo dure 30 minutes et coûte 3 000 FCFA par personne.',
    en: 'Pedal boating lasts 30 minutes and costs 3,000 FCFA per person.' },
  { keys: ['traversee','pirogue','crossing','boat transfer','transport sur le lac'], priority: 8,
    fr: 'La traversée aller-retour est à 1 500 FCFA par adulte et 500 FCFA par enfant de moins de 12 ans (12 ans et plus : tarif adulte). Elle est déjà incluse dans nos forfaits : pas de double paiement.',
    en: 'Return boat crossing is 1,500 FCFA per adult and 500 FCFA per child under 12 (ages 12+ pay adult rate). It is already included in our packages, with no double charge.' },
  { keys: ['restaurant','manger','mange','repas','plat','poisson','boisson','food','eat','meal','menu','drink','grillade','aloco','frites','carpe','braise','igname','accompagnement'], priority: 7,
    fr: 'Notre Restaurant & Bar propose du bar et de la carpe braisés, des brochettes de poulet, des accompagnements et des boissons fraîches. Merci de confirmer votre commande avant votre arrivée. Les prix des plats sont à demander à notre équipe.',
    en: 'Our Restaurant & Bar serves grilled sea bass and carp, chicken skewers, sides and cold drinks. Please confirm your order before arrival. Ask our team for menu prices.' },
  { keys: ['horaire','horaires','heure','ouvert','ouverture','ferme','samedi','dimanche','jour ferie','open','opening','hours','weekend','closing','a quelle heure'], priority: 7,
    fr: 'AQUAMAZONE est ouvert les samedis, dimanches et jours fériés de 11h à 18h. Les visites en semaine sont possibles sur réservation pour les groupes de 6 personnes minimum (4 activités par personne).',
    en: 'AQUAMAZONE is open Saturdays, Sundays and public holidays, 11am–6pm. Weekday visits can be arranged in advance for groups of at least 6 people (4 activities per person).' },
  { keys: ['localisation','adresse','situe','ou se trouve','ou etes','itineraire','chemin','venir','route','location','address','direction','where','find you','get there'], priority: 7,
    fr: 'Nous sommes au Village Adounko, Route des Pêches, Cotonou, Bénin. Depuis Carrefour Club des Rois, allez vers Togbin Plage, passez la station JBP et suivez les panneaux AQUAMAZONE vers le lac. Le point GPS exact reste à vérifier.',
    en: 'We are in Adounko Village, Route des Pêches, Cotonou, Benin. From Carrefour Club des Rois, continue toward Togbin Plage, pass the JBP station, and follow signs to the lake. Our exact GPS pin has not yet been verified.' },
  { keys: ['groupe','semaine','6 personnes','sortie scolaire','group','weekday','school trip','private visit'], priority: 7,
    fr: 'Nous accueillons les groupes d’au moins 6 personnes en semaine, sur réservation préalable, avec une formule de 4 activités par personne. Contactez notre équipe pour organiser votre sortie.',
    en: 'We welcome groups of at least 6 people during the week by advance reservation, with a package of 4 activities per person. Contact our team to arrange your visit.' },
  { keys: ['reservation','reserver','payer','paiement','disponible','disponibilite','place libre','book','booking','pay','payment','availability','available','momo'], priority: 7,
    fr: 'Pour réserver ou confirmer une disponibilité, contactez notre équipe au +229 01 54 28 44 44 sur WhatsApp. Les réservations et paiements sur ce site ne sont pas encore actifs. Je ne peux confirmer ni réservation ni paiement.',
    en: 'To book or confirm availability, message our team on WhatsApp at +229 01 54 28 44 44. Website bookings and payments are not yet active. I cannot confirm bookings or payments.' },
  { keys: ['forfait','pack','package','prix','tarif','cost','price','combien'], priority: 2,
    fr: 'Nos activités principales coûtent généralement 3 000 FCFA par personne, selon l’activité. Forfaits : GLÈLÈ solo 5 000 FCFA/adulte ou 3 500 FCFA/enfant ; GUÉZO couple 12 000 FCFA ; BÉHANZIN groupe (4 adultes) 36 000 FCFA. Le tarif TOFFA doit être confirmé. Quelle activité ou quel forfait vous intéresse ?',
    en: 'Most core activities cost 3,000 FCFA per person, depending on the activity. Packages: GLÈLÈ solo 5,000 FCFA/adult or 3,500 FCFA/child; GUÉZO couple 12,000 FCFA; BÉHANZIN for 4 adults 36,000 FCFA. The TOFFA price needs confirmation. Which activity or package interests you?' },
  { keys: ['activite','activites','faire','proposer','proposez','propose','loisir','loisirs','experience','experiences','activities','activity','things to do','what can','offer'], priority: 1,
    fr: 'Nous proposons pédalo, canoë-kayak, paddle, bateau à pédales, Water Ball, balade sur le lac et découverte des mangroves. Le jet-ski est temporairement indisponible. Souhaitez-vous connaître le prix d’une activité ?',
    en: 'We offer pedal boating, canoe-kayak, stand-up paddle, pedal-powered boats, Water Ball, lake outings and mangrove discovery. Jet skiing is temporarily unavailable. Would you like a price for a specific activity?' },
  { keys: ['bonjour','salut','coucou','hello','hi','hey','bonsoir'], priority: 0,
    fr: 'Bonjour et bienvenue à AQUAMAZONE ADVENTURE ! Nous proposons des activités nautiques, des balades sur le lac et un Restaurant & Bar à Adounko. Que souhaitez-vous découvrir ?',
    en: 'Hello and welcome to AQUAMAZONE ADVENTURE! We offer water activities, lake outings and a Restaurant & Bar in Adounko. What would you like to explore?' }
];

const unverified = {
  fr: 'Je peux vous renseigner sur nos activités, tarifs, forfaits, horaires, restaurant et accès. Pouvez-vous préciser ce que vous souhaitez savoir ? Pour une demande particulière, notre équipe est joignable sur WhatsApp au ' + kb.contact.whatsapp + '.',
  en: 'I can help with activities, prices, packages, opening hours, food and directions. Could you tell me a little more about what you need? Our team is also available on WhatsApp at ' + kb.contact.whatsapp + '.'
};

export function groundedGuideReply(message: string, lang: VisitorLanguage, history: VisitorTurn[] = []): GuideResult {
  const query = normalize(message);
  const scores = topics.map(topic => {
    const score = topic.keys.reduce((max,key)=>{
      const needle=normalize(key);
      if (!needle) return max;
      const padded=' '+query+' ';
      if (padded.includes(' '+needle+' ')) return Math.max(max, needle.length + (topic.priority || 0));
      return max;
    },0);
    return score;
  });
  const best = Math.max(...scores);
  if(best > 0) {
    const idx = scores.indexOf(best);
    return { reply: topics[idx][lang], matched: true };
  }
  // Only use the most recent user turn as context for brief follow-ups.
  const followup=/^(et|and|pour|for|what about|how about|c est combien|how much|combien|quel prix|the price|son prix|their price|oui|yes|ok|okay)( |$)/.test(query) || query.split(' ').length <= 3;
  if (followup) {
    const recent=history.slice().reverse().find(turn=>turn.role==='user');
    if(recent) {
      const context=normalize(recent.content);
      const contextScores=topics.map(t=>t.keys.some(k=>(' '+context+' ').includes(' '+normalize(k)+' ')) ? (t.priority || 0) : -1);
      const index=contextScores.indexOf(Math.max(...contextScores));
      if(index>=0 && contextScores[index]>=0) return {reply:topics[index][lang],matched:true};
    }
  }
  return {reply:unverified[lang],matched:false};
}
