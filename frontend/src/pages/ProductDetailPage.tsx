import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, RefreshCw, Shield, ChevronLeft, ChevronRight, Star, Minus, Plus, Share2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductCard';
import { RatingStars } from '../components/ui/RatingStars';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToast } = useToast();

  const product = products.find(p => p.id === id);
  const related = products.filter(p => p.category === product?.category && p.id !== id).slice(0, 4);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  if (!product) {
    return (
      <Layout>
        <div className="container-custom py-24 text-center">
          <h2 className="section-title mb-4">Product Not Found</h2>
          <button onClick={() => navigate('/products')} className="btn-primary">Browse Products</button>
        </div>
      </Layout>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 1) { addToast('Please select a size', 'warning'); return; }
    if (!selectedColor && product.colors.length > 1) { addToast('Please select a color', 'warning'); return; }
    addToCart(product, selectedSize || product.sizes[0], selectedColor || product.colors[0].name, quantity);
    addToast(`${product.name} added to cart!`, 'success');
  };

  const handleBuyNow = () => {
    if (!selectedSize && product.sizes.length > 1) { addToast('Please select a size', 'warning'); return; }
    addToCart(product, selectedSize || product.sizes[0], selectedColor || product.colors[0].name, quantity);
    navigate('/checkout');
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-900">Products</Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container-custom pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="hidden sm:flex flex-col gap-3 w-20 flex-shrink-0">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-gray-900' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative overflow-hidden rounded-2xl aspect-[3/4] bg-gray-100">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Nav arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-soft hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => (i + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-soft hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 badge bg-red-500 text-white text-sm px-3 py-1">
                  -{product.discount}%
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Title */}
            <div>
              <div className="flex items-center justify-between">
                <Link to={`/products?brand=${product.brand}`} className="text-sm font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-900">
                  {product.brand}
                </Link>
                <button className="btn-ghost p-2"><Share2 className="w-4 h-4" /></button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-2 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <RatingStars rating={product.rating} count={product.reviewCount} size="md" />
                {product.isBestseller && <span className="badge bg-amber-100 text-amber-800">Bestseller</span>}
                {product.isNew && <span className="badge bg-gray-900 text-white">New</span>}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="text-sm font-semibold text-green-600">Save {formatPrice(product.originalPrice - product.price)}</span>
                </>
              )}
            </div>

            {/* Color Selector */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Color: <span className="font-normal text-gray-600">{selectedColor || 'Select'}</span>
              </p>
              <div className="flex gap-2.5">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.name}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.name ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hex, outline: '2px solid #e5e7eb', outlineOffset: '1px' }}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            {product.sizes.length > 1 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Size: <span className="font-normal text-gray-600">{selectedSize || 'Select'}</span>
                  </p>
                  <button className="text-xs text-gray-500 underline hover:text-gray-900">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                        selectedSize === size
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-700 hover:border-gray-900'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-gray-500 hover:text-gray-900"><Minus className="w-4 h-4" /></button>
                <span className="w-6 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stockCount, q + 1))} className="text-gray-500 hover:text-gray-900"><Plus className="w-4 h-4" /></button>
              </div>
              <span className="text-xs text-gray-500">{product.stockCount} left in stock</span>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} className="flex-1 btn-primary py-4 text-base rounded-2xl">
                <ShoppingBag className="w-5 h-5" /> Add to Cart
              </button>
              <button
                onClick={() => { toggleWishlist(product); addToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success'); }}
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                  wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>
            <button onClick={handleBuyNow} className="w-full btn-secondary py-4 text-base rounded-2xl">
              Buy Now
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: <Truck className="w-4 h-4" />, text: 'Free Delivery above ₹999' },
                { icon: <RefreshCw className="w-4 h-4" />, text: '30-Day Easy Returns' },
                { icon: <Shield className="w-4 h-4" />, text: '100% Authentic' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
                  <span className="text-gray-600">{b.icon}</span>
                  <span className="text-xs text-gray-600 leading-tight">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-t pt-6">
              <div className="flex gap-1 mb-6 border-b border-gray-100">
                {(['description', 'specs', 'reviews'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all -mb-px ${
                      activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'specs' ? 'Specifications' : tab}
                  </button>
                ))}
              </div>

              {activeTab === 'description' && (
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              )}
              {activeTab === 'specs' && (
                <dl className="space-y-3">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex gap-4 text-sm">
                      <dt className="w-32 flex-shrink-0 font-medium text-gray-900">{key}</dt>
                      <dd className="text-gray-600">{val}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900">{product.rating}</p>
                      <RatingStars rating={product.rating} showCount={false} size="sm" />
                      <p className="text-xs text-gray-500 mt-1">{product.reviewCount} reviews</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center py-4">Detailed reviews coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="section-title mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
