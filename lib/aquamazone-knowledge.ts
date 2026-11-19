/**
 * Single source of verified public facts for the Aquamazone visitor assistant.
 * Edit this file after business approval; never include private admin data.
 * Website content should progressively migrate to this source.
 */
export const businessKnowledge = {
  name: 'AQUAMAZONE ADVENTURE',
  slogan: 'La détente au fil de l’eau.',
  location: {
    address: 'Village Adounko, Route des Pêches, Cotonou, Bénin',
    directions: 'Carrefour Club des Rois → grand Carrefour Togbin Plage → station-service JBP → panneaux AQUAMAZONE → tourner à droite vers le lac → embarcadère.',
    maps: 'https://maps.google.com/?q=Togbin+Plage+AQUAMAZONE',
    note: 'Le point GPS exact du site n’est pas encore vérifié. Ne jamais prétendre que le lien Maps pointe exactement sur l’entrée.'
  },
  contact: {
    whatsapp: '+229 01 54 28 44 44',
    whatsappUrl: 'https://wa.me/2290154284444',
    email: 'aquamazone229@gmail.com'
  },
  hours: {
    saturday: '11h–18h',
    sunday: '11h–18h',
    publicHolidays: '11h–18h',
    weekdays: 'Uniquement sur réservation préalable pour les groupes de 6 personnes minimum, avec formule 4 activités par personne.'
  },
  crossing: {
    adult: '1 500 FCFA aller-retour',
    childUnder12: '500 FCFA aller-retour',
    age12Plus: 'Tarif adulte',
    packages: 'Traversée déjà incluse dans le forfait : aucun paiement en double.'
  },
  activities: [
    { name:'Pédalo', duration:'30 min', rate:'3 000 FCFA/personne' },
    { name:'Canoë/Kayak', duration:'30 min', rate:'3 000 FCFA/personne' },
    { name:'Stand-up paddle', duration:'30 min', rate:'3 000 FCFA/personne' },
    { name:'Bateau à pédales', duration:'30 min', rate:'5 000 FCFA/personne pour 2 participants ; à partir de 3 personnes, 3 000 FCFA/personne', capacity:'2 bateaux, maximum 4 passagers chacun' },
    { name:'Bulle gonflable / Water Ball', duration:'20 min', rate:'3 000 FCFA/personne' },
    { name:'Balade sur le lac', duration:'30 min', rate:'Tarif à confirmer directement avec l’équipe' },
    { name:'Découverte des mangroves', duration:'Durée variable', rate:'Tarif à confirmer directement avec l’équipe' },
    { name:'Jet-ski', status:'INDISPONIBLE — maintenance, pas de réservation' }
  ],
  packages: [
    { name:'GLÈLÈ', type:'Solo', rate:'5 000 FCFA/adulte ; 3 500 FCFA/enfant', includes:'Traversée aller-retour + UNE activité au choix : canoë simple OU pédalo simple (30 min).' },
    { name:'GUÉZO', type:'Couple (2 personnes)', rate:'12 000 FCFA/couple', includes:'Traversée aller-retour, canoë double ET pédalo double, eau offerte.' },
    { name:'TOFFA', type:'Famille (2 adultes + 2 enfants)', rate:'18 000 FCFA — à reconfirmer avec l’équipe avant toute promesse commerciale', includes:'Traversée aller-retour, canoë double, pédalo double, eau offerte — confirmer modalités exactes auprès de l’équipe.' },
    { name:'BÉHANZIN', type:'Groupe (4 adultes)', rate:'36 000 FCFA/groupe', includes:'Traversée aller-retour, canoë double, balade sur le lac, pédalo, eau offerte.' }
  ],
  restaurant: {
    availability: 'Week-ends et jours fériés, confirmer la commande avant arrivée.',
    grillades: ['Bar braisé','Carpe braisée','Brochettes de poulet'],
    otherDishes: ['Gari Gnignan + œufs brouillés : 3 000 FCFA'],
    sides: ['Riz','Aloco','Légumes sautés','Pommes frites','Pommes sautées','Igname','Patate douce'],
    drinks: [
      'Sucreries : 1 000 à 1 500 FCFA',
      'Cocktails : 3 000 FCFA',
      'Vins : 9 000 à 15 000 FCFA',
      'Champagne : 50 000 FCFA',
      'Bières : 1 500 à 2 000 FCFA',
      'Eaux : 500 à 1 500 FCFA',
      'Alcools : 1 000 à 3 000 FCFA',
      'Thé vert ou citronnelle chaud : 1 500 FCFA',
      'Café : 1 500 FCFA'
    ],
    prices: 'Bar braisé : 6 500 FCFA. Carpe braisée : 6 500 à 9 000 FCFA selon la taille. Brochettes de poulet : 6 000 FCFA. Chacun de ces trois plats comprend un accompagnement au choix inclus dans son prix. Toute portion ou tout accompagnement supplémentaire coûte 1 500 FCFA. Bar et carpe braisés disponibles chaque week-end. Gari Gnignan avec œufs brouillés : 3 000 FCFA.'
  },
  booking: {
    status: 'Le module de réservation et de paiement en ligne n’est PAS opérationnel.',
    route: 'Contacter l’équipe sur WhatsApp pour réservations, disponibilités, confirmations et demandes particulières.',
    restrictions: 'Ne confirmer aucune réservation, disponibilité ou paiement au nom d’Aquamazone.'
  },
  assistant: {
    languages: ['fr','en'],
    scope: 'Réponses informatives uniquement ; aucun accès à des données personnelles, à la disponibilité en temps réel, aux paiements ni aux dossiers de réservation.'
  }
} as const;

export const assistantKnowledgeText = JSON.stringify(businessKnowledge, null, 2);
