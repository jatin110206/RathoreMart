import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, WishlistItem } from '../types';

interface WishlistState { items: WishlistItem[] }

type WishlistAction =
  | { type: 'ADD'; payload: Product }
  | { type: 'REMOVE'; payload: string }
  | { type: 'CLEAR' };

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'ADD':
      if (state.items.find(i => i.product.id === action.payload.id)) return state;
      return { items: [...state.items, { product: action.payload, addedAt: new Date().toISOString() }] };
    case 'REMOVE':
      return { items: state.items.filter(i => i.product.id !== action.payload) };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
};

interface WishlistContextType {
  state: WishlistState;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] }, () => {
    try {
      const saved = localStorage.getItem('rathoremart_wishlist');
      return saved ? JSON.parse(saved) : { items: [] };
    } catch { return { items: [] }; }
  });

  useEffect(() => {
    localStorage.setItem('rathoremart_wishlist', JSON.stringify(state));
  }, [state]);

  const addToWishlist = (product: Product) => dispatch({ type: 'ADD', payload: product });
  const removeFromWishlist = (productId: string) => dispatch({ type: 'REMOVE', payload: productId });
  const isWishlisted = (productId: string) => state.items.some(i => i.product.id === productId);
  const toggleWishlist = (product: Product) =>
    isWishlisted(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);
  const clearWishlist = () => dispatch({ type: 'CLEAR' });

  return (
    <WishlistContext.Provider value={{ state, addToWishlist, removeFromWishlist, isWishlisted, toggleWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
