import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { App } from 'antd';
import type { ICartItem } from '@/services/type';

interface ICartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: ICartItem[];
}

interface ICartContext {
  cart: ICartState;
  itemCount: number;
  subtotal: number;
  addItem: (restaurantId: string, restaurantName: string, item: Omit<ICartItem, 'quantity'>) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<ICartContext | null>(null);

const INITIAL_STATE: ICartState = {
  restaurantId: null,
  restaurantName: null,
  items: [],
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<ICartState>(() => {
    try {
      const stored = localStorage.getItem('fotr_cart');
      return stored ? JSON.parse(stored) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });
  const { modal } = App.useApp();

  const persist = useCallback((state: ICartState) => {
    setCart(state);
    localStorage.setItem('fotr_cart', JSON.stringify(state));
  }, []);

  const addItem = useCallback(
    (restaurantId: string, restaurantName: string, item: Omit<ICartItem, 'quantity'>) => {
      setCart((prev) => {
        // Different restaurant — confirm clear
        if (prev.restaurantId && prev.restaurantId !== restaurantId && prev.items.length > 0) {
          modal.confirm({
            title: 'Start a new cart?',
            content: `You have items from ${prev.restaurantName}. Adding from a new restaurant will clear your current cart.`,
            okText: 'Clear & add',
            cancelText: 'Keep current',
            onOk: () => {
              const newState: ICartState = {
                restaurantId,
                restaurantName,
                items: [{ ...item, quantity: 1 }],
              };
              persist(newState);
            },
          });
          return prev;
        }

        const existing = prev.items.find((i) => i.menuItemId === item.menuItemId);
        let newItems: ICartItem[];
        if (existing) {
          newItems = prev.items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
          );
        } else {
          newItems = [...prev.items, { ...item, quantity: 1 }];
        }

        const newState: ICartState = { restaurantId, restaurantName, items: newItems };
        localStorage.setItem('fotr_cart', JSON.stringify(newState));
        return newState;
      });
    },
    [modal, persist],
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      setCart((prev) => {
        const newItems =
          quantity <= 0
            ? prev.items.filter((i) => i.menuItemId !== menuItemId)
            : prev.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i));
        const newState = { ...prev, items: newItems };
        if (newItems.length === 0) {
          const cleared = INITIAL_STATE;
          localStorage.setItem('fotr_cart', JSON.stringify(cleared));
          return cleared;
        }
        localStorage.setItem('fotr_cart', JSON.stringify(newState));
        return newState;
      });
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    updateQuantity(menuItemId, 0);
  }, [updateQuantity]);

  const clearCart = useCallback(() => {
    persist(INITIAL_STATE);
  }, [persist]);

  const itemCount = useMemo(() => cart.items.reduce((sum, i) => sum + i.quantity, 0), [cart.items]);
  const subtotal = useMemo(
    () => cart.items.reduce((sum, i) => sum + i.priceAmount * i.quantity, 0),
    [cart.items],
  );

  const value = useMemo<ICartContext>(
    () => ({ cart, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart }),
    [cart, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): ICartContext => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
