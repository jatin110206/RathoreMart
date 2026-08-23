import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Heart, ArrowRight, Tag, ShoppingBag } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { products } from '../data/products';

const recommended = products.slice(0, 4);

const COUPONS: Record<string, number> = { KHAREEDLO10: 10, SAVE20: 20, FIRST15: 15 };

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, removeFromCart, updateQuantity, subtotal } = useCart();
  const { addToWishlist } = useWishlist();
  const { addToast } = useToast();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;
  const shipping = subtotal >= 999 ? 0 : 99;
  const discountAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discountAmt + shipping;

  const applyCoupon = () => {
    const pct = COUPONS[coupon.toUpperCase()];
    if (pct) {
      setDiscount(pct);
      setAppliedCoupon(coupon.toUpperCase());
      addToast(`Coupon applied! ${pct}% off`, 'success');
    } else {
      addToast('Invalid coupon code', 'error');
    }
  };

  const moveToWishlist = (productId: string, size: string, color: string) => {
    const item = state.items.find(i => i.product.id === productId);
    if (item) {
      addToWishlist(item.product);
      removeFromCart(productId, size, color);
      addToast('Moved to wishlist', 'success');
    }
  };

  if (state.items.length === 0) {
    return (
      <Layout>
        <div className="container-custom py-32 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything yet. Let's fix that!</p>
            <button onClick={() => navigate('/products')} className="btn-primary px-8">Start Shopping</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-10">
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-8">
          Shopping Cart <span className="text-gray-400 text-lg font-normal">({state.items.length} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item, idx) => (
              <div key={idx} className="flex gap-5 p-5 bg-white rounded-2xl shadow-card">
                <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                  <img src={item.product.images[0]} alt={item.product.name}
                    className="w-28 h-36 object-cover rounded-xl hover:opacity-90 transition-opacity" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">{item.product.brand}</p>
                      <Link to={`/products/${item.product.id}`} className="text-sm font-semibold text-gray-900 hover:text-gray-600 line-clamp-2">
                        {item.product.name}
                      </Link>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 h-fit">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">Size: {item.selectedSize}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{item.selectedColor}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
                      <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)} className="text-gray-500 hover:text-gray-900">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)} className="text-gray-500 hover:text-gray-900">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                      {item.quantity > 1 && <p className="text-xs text-gray-400">{formatPrice(item.product.price)} each</p>}
                    </div>
                  </div>

                  <button onClick={() => moveToWishlist(item.product.id, item.selectedSize, item.selectedColor)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 mt-3 transition-colors">
                    <Heart className="w-3.5 h-3.5" /> Move to Wishlist
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24 space-y-5">
              <h3 className="font-semibold text-gray-900 text-lg">Order Summary</h3>

              {/* Coupon */}
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <button onClick={applyCoupon} className="btn-secondary px-4 py-2.5 text-sm">Apply</button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-green-600 mt-2 font-medium">✓ {appliedCoupon} applied — {discount}% off!</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">Try: KHAREEDLO10, SAVE20, FIRST15</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount}%)</span><span>-{formatPrice(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">Add {formatPrice(999 - subtotal)} more for free shipping</p>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-100 text-base">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-4 text-base rounded-2xl justify-between">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Recommended */}
        <div className="mt-16">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Customers Also Bought</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {recommended.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
    </Layout>
  );
};
