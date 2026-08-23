import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { state, closeCart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  if (!state.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" onClick={closeCart} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-modal flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-semibold text-gray-900">Your Cart</span>
            {totalItems > 0 && (
              <span className="badge bg-gray-100 text-gray-600">{totalItems}</span>
            )}
          </div>
          <button onClick={closeCart} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Your cart is empty</p>
                <p className="text-sm text-gray-500 mt-1">Start adding items you love</p>
              </div>
              <button
                onClick={() => { navigate('/products'); closeCart(); }}
                className="btn-primary mt-2"
              >
                Shop Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-2xl">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{item.product.brand}</p>
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Size: {item.selectedSize}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{item.selectedColor}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {/* Qty */}
                      <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center hover:text-gray-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center hover:text-gray-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-center text-gray-500">
                Add {formatPrice(999 - subtotal)} more for free shipping
              </p>
            )}
            <button
              onClick={() => { navigate('/checkout'); closeCart(); }}
              className="btn-primary w-full justify-between"
            >
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/cart"
              onClick={closeCart}
              className="block text-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
};
