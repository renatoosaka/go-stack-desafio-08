import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketPlace:cart');

      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        const cart = [...products, { ...product, quantity: 1 }];
        setProducts(cart);
        await AsyncStorage.setItem('@GoMarketPlace:cart', JSON.stringify(cart));
      } else {
        const item = products[productIndex];
        item.quantity += 1;

        const cart = products.map(p => (p.id === item.id ? item : p));
        setProducts(cart);
        await AsyncStorage.setItem('@GoMarketPlace:cart', JSON.stringify(cart));
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(cart);
      await AsyncStorage.setItem('@GoMarketPlace:cart', JSON.stringify(cart));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      setProducts(cart.filter(product => product.quantity > 0));
      await AsyncStorage.setItem('@GoMarketPlace:cart', JSON.stringify(cart));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
