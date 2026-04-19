import type { ISchemaNode } from '@/components/Render/type';

/**
 * Dev-time fallback schema for the restaurant page.
 * In production the schema is fetched from the admin-published backend;
 * this local copy is only used when that fetch fails (offline, backend down,
 * or running without the admin service).
 */
export const RESTAURANT_PAGE_SCHEMA: ISchemaNode = {
  name: 'RestaurantPage',
  props: {},
  children: [
    {
      name: 'HeroBanner',
      props: {
        title: "Aunty Lily's Nasi Lemak",
        subtitle: 'Authentic kampung flavours since 1985',
        image: 'https://placehold.co/1200x400/f59e0b/fff?text=Aunty+Lily+Kitchen',
        rating: 4.7,
        deliveryTime: 25,
        address: 'Bukit Bintang, KL',
      },
      children: [],
    },
    {
      name: 'MenuGrid',
      props: {
        api: '/api/menu',
        title: 'Our Menu',
      },
      children: [],
    },
    {
      name: 'ReviewList',
      props: {
        api: '/api/reviews',
        title: 'Customer Reviews',
      },
      children: [],
    },
    {
      name: 'InfoCard',
      props: {
        openingHours: '7:00 AM – 3:00 PM',
        phone: '+60 12-345 6789',
        address: 'No 12, Jalan Bukit Bintang, 55100 KL',
      },
      children: [],
    },
  ],
};
