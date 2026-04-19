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
