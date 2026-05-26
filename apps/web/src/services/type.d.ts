export type TUserRole = 'customer' | 'rider' | 'merchant' | 'admin';

export type TOAuthProvider = 'google' | 'apple' | 'facebook';

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  role: TUserRole;
}

export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface IAuthResponse extends IAuthTokens {
  user: IAuthUser;
}

export interface ILoginParams {
  email: string;
  password: string;
}

export interface IRegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface IOAuthParams {
  id_token: string;
}

export interface IForgotPasswordParams {
  email: string;
}

export interface IApiError {
  error: string;
}

export interface IRestaurant {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  flavour: string;
  priceRange: string;
  rating: number;
  deliveryTime: number;
  deliveryFee: number;
  hasFreeDelivery: boolean;
  hasPromo: boolean;
  promoLabel: string;
  isNew: boolean;
  isHalal: boolean;
  tags: string[];
  image: string;
  address: string;
  coordinates: [number, number];
}

export interface IGetRestaurantListParams {
  cuisine?: string;
  category?: string;
  flavour?: string;
  priceRange?: string;
}

export interface IBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface ICuisineShortcut {
  value: string;
  label: string;
  icon: string;
  color: string;
}

/* ─── Menu ─── */

export interface IMenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface IMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  priceAmount: number; // cents (e.g. 1250 = RM 12.50)
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface IMenuData {
  categories: IMenuCategory[];
  items: IMenuItem[];
}

/* ─── Cart ─── */

export interface ICartItem {
  menuItemId: string;
  name: string;
  imageUrl: string;
  priceAmount: number;
  quantity: number;
  note?: string;
}

export interface ICart {
  restaurantId: string;
  restaurantName: string;
  items: ICartItem[];
}

/* ─── Orders ─── */

export type TOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface IOrderItem {
  id: string;
  name: string;
  priceAmount: number;
  quantity: number;
}

export interface IOrder {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  status: TOrderStatus;
  subtotalAmount: number;
  deliveryFeeAmount: number;
  totalAmount: number;
  note?: string;
  items: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}
