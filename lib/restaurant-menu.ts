/**
 * Restaurant prices must be approved by Aquamazone before publication.
 * Enter an amount in FCFA for a confirmed item; null means not yet confirmed.
 * Displayed on the FR and EN website from this single catalog.
 */
export type RestaurantItem = {
  id: string;
  fr: string;
  en: string;
  priceXof: number | null;
  noteFr?: string;
  noteEn?: string;
};

export const restaurantMenu: {
  grills: RestaurantItem[];
  sides: RestaurantItem[];
  drinks: RestaurantItem[];
} = {
  grills: [
    { id:'bar', fr:'Bar braisé', en:'Grilled sea bass', priceXof:null },
    { id:'carpe', fr:'Carpe braisée', en:'Grilled carp', priceXof:null },
    { id:'brochettes', fr:'Brochettes de poulet', en:'Chicken skewers', priceXof:null },
  ],
  sides: [
    { id:'riz', fr:'Riz', en:'Rice', priceXof:null },
    { id:'aloco', fr:'Aloco', en:'Fried plantain (aloco)', priceXof:null },
    { id:'legumes', fr:'Légumes sautés', en:'Sautéed vegetables', priceXof:null },
    { id:'frites', fr:'Pommes frites', en:'French fries', priceXof:null },
    { id:'pommes-sautees', fr:'Pommes sautées', en:'Sautéed potatoes', priceXof:null },
    { id:'igname', fr:'Igname', en:'Yam', priceXof:null },
    { id:'patates-douces', fr:'Patates douces', en:'Sweet potatoes', priceXof:null },
  ],
  drinks: [
    { id:'boissons', fr:'Boissons fraîches', en:'Cold drinks', priceXof:null },
  ],
};
