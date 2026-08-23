import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  const handleAddToCart = (productId: string) => {
    const item = state.items.find(i => i.product.id === productId);
    if (item) {
      addToCart(item.product, item.product.sizes[0], item.product.colors[0].name, 1);
      addToast(`${item.product.name} added to cart!`, 'success');
    }
  };

  if (state.items.length === 0) {
    return (
      <Layout>
        <div className="container-custom py-32 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8">Save items you love to find them easily later.</p>
          <button onClick={() => navigate('/products')} className="btn-primary px-8">Explore Products</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            My Wishlist <span className="text-gray-400 text-lg font-normal">({state.items.length})</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {state.items.map((item) => (
            <div key={item.product.id} className="group relative">
              <div className="product-image-container mb-3 cursor-pointer" onClick={() => navigate(`/products/${item.product.id}`)}>
                <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                {/* Remove */}
                <button
                  onClick={e => { e.stopPropagation(); removeFromWishlist(item.product.id); addToast('Removed from wishlist', 'info'); }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-soft text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Add to cart */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button
                    onClick={e => { e.stopPropagation(); handleAddToCart(item.product.id); }}
                    className="w-full btn-primary text-xs py-2.5 rounded-xl gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-0.5">{item.product.brand}</p>
              <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.product.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm font-bold text-gray-900">{formatPrice(item.product.price)}</span>
                {item.product.originalPrice > item.product.price && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(item.product.originalPrice)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};
