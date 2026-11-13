import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const addToCart = (component, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => (item.component._id || item.component.id) === (component._id || component.id));
      if (existing) {
        const newQty = Math.min(component.availableStock, existing.quantity + quantity);
        return prev.map(item => 
          (item.component._id || item.component.id) === (component._id || component.id)
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { component, quantity: Math.min(component.availableStock, quantity) }];
    });
    setIsRequestModalOpen(true);
  };

  const removeFromCart = (componentId) => {
    setCartItems(prev => prev.filter(item => (item.component._id || item.component.id) !== componentId));
  };

  const updateQuantity = (componentId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(componentId);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if ((item.component._id || item.component.id) === componentId) {
        const clamped = Math.min(item.component.availableStock, quantity);
        return { ...item, quantity: clamped };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isRequestModalOpen,
      setIsRequestModalOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
