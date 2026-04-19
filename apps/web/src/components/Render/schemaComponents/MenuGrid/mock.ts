import { MENU_ITEMS } from '@/mock/restaurants';
import type { IComponentFixtures } from '../../preview/fixtures';
import type { TMenuGridData } from './type';

const normal: TMenuGridData = MENU_ITEMS;

const heavy: TMenuGridData = Array.from({ length: 60 }, (_, i) => ({
  id: `heavy-${i}`,
  name: `Heavy Item #${i + 1}`,
  price: Math.round(Math.random() * 5000) / 100,
  tag: i % 5 === 0 ? 'Popular' : '',
  image: `https://placehold.co/200x160/f59e0b/fff?text=Item+${i + 1}`,
}));

const edge: TMenuGridData = [
  {
    id: 'edge-long-name',
    name: '🍕 '.repeat(30) + 'Super Extra Mega Long Dish Name That Should Wrap',
    price: 9_999_999.99,
    tag: 'VERY-LONG-TAG-OVERFLOW-CHECK',
    image: 'broken-url-does-not-resolve',
  },
  {
    id: 'edge-empty',
    name: '',
    price: 0,
    tag: '',
    image: '',
  },
  {
    id: 'edge-negative',
    name: 'Negative Price Sentinel',
    price: -1,
    tag: 'BUG',
    image: 'https://placehold.co/200x160/ef4444/fff?text=NEG',
  },
];

export const menuGridFixtures: IComponentFixtures<TMenuGridData> = {
  presets: {
    normal,
    empty: [],
    heavy,
    edge,
  },
  errorMessage: 'HTTP 500: menu service unavailable',
};
