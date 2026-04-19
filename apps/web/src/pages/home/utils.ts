import type { IFilterVal } from '@/components/Filter/type';
import type { IRestaurant } from '@/services/type';

/**
 * Apply the full home-page filter (select dropdowns + quick chips) to a list.
 */
export const applyHomeFilter = (
  list: IRestaurant[],
  filter: IFilterVal,
): IRestaurant[] => {
  return list.filter((r) => {
    if (filter.cuisine && r.cuisine !== filter.cuisine) return false;
    if (filter.category && r.category !== filter.category) return false;
    if (filter.flavour && r.flavour !== filter.flavour) return false;
    if (filter.priceRange && r.priceRange !== filter.priceRange) return false;
    if (filter.freeDelivery && !r.hasFreeDelivery) return false;
    if (filter.under30 && r.deliveryTime > 30) return false;
    if (filter.highRating && r.rating < 4.5) return false;
    if (filter.promo && !r.hasPromo) return false;
    if (filter.halal && !r.isHalal) return false;
    return true;
  });
};

/** Top rated restaurants for the "Popular near you" rail. */
export const pickPopular = (list: IRestaurant[], limit = 8): IRestaurant[] => {
  return [...list].sort((a, b) => b.rating - a.rating).slice(0, limit);
};

/** Fast delivery rail — under 30 min, sorted by deliveryTime. */
export const pickUnder30 = (list: IRestaurant[], limit = 8): IRestaurant[] => {
  return list
    .filter((r) => r.deliveryTime <= 30)
    .sort((a, b) => a.deliveryTime - b.deliveryTime)
    .slice(0, limit);
};

/** New openings rail. */
export const pickNew = (list: IRestaurant[], limit = 8): IRestaurant[] => {
  return list.filter((r) => r.isNew).slice(0, limit);
};

/** Promo rail. */
export const pickPromo = (list: IRestaurant[], limit = 8): IRestaurant[] => {
  return list.filter((r) => r.hasPromo).slice(0, limit);
};
