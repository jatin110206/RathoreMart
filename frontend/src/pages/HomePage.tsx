import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductCard';
import { RatingStars } from '../components/ui/RatingStars';
import { products, categories, reviews } from '../data/products';

const featuredProducts = products.filter(p => p.isBestseller).slice(0, 8);
const newArrivals = products.filter(p => p.isNew).slice(0, 4);
const trending = products.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);

const features = [
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Authentic Products', desc: '100% genuine, curated brands' },
  { icon: <RefreshCw className="w-5 h-5" />, title: 'Easy Returns', desc: '30-day hassle-free returns' },
  { icon: <Sparkles className="w-5 h-5" />, title: 'Premium Quality', desc: 'Handpicked for excellence' },
  { icon: <Headphones className="w-5 h-5" />, title: '24/7 Support', desc: 'Always here to help' },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');

  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#F9F5F0]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80"
            alt="Hero"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="container-custom relative z-10 py-24">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-4">New Season · 2026</span>
            <h1 className="section-title text-5xl md:text-7xl font-display font-bold text-gray-900 leading-tight mb-6">
              Dress With<br />
              <em className="text-primary-700 not-italic">Intention</em>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
              Curated fashion for those who value craft, quality, and timeless style over trends.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/products')} className="btn-primary px-8 py-4 text-base rounded-full gap-3">
                Explore Collection <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/products?category=women')} className="btn-secondary px-8 py-4 text-base rounded-full">
                Women's Edit
              </button>
            </div>
            <div className="flex items-center gap-6 mt-12">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-xs text-gray-500 mt-0.5">Products</p>
              </div>
              <div className="w-px h-10 bg-gray-300" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">50k+</p>
                <p className="text-xs text-gray-500 mt-0.5">Happy Customers</p>
              </div>
              <div className="w-px h-10 bg-gray-300" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">4.9★</p>
                <p className="text-xs text-gray-500 mt-0.5">Avg Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b border-gray-100">
        <div className="container-custom py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-gray-700">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-20">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2">Shop by</p>
              <h2 className="section-title">Categories</h2>
            </div>
            <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold text-sm leading-tight">{cat.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{cat.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending ── */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2">Most Popular</p>
              <h2 className="section-title">Trending Now</h2>
            </div>
            <Link to="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── Promo Banner ── */}
      <section className="py-20">
        <div className="container-custom">
          <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80"
              alt="Summer Collection"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent" />
            <div className="relative z-10 px-10 py-16 max-w-lg">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-3 block">Limited Time Offer</span>
              <h2 className="text-4xl font-display font-bold text-white mb-4">Summer Edit<br />Up to 40% Off</h2>
              <p className="text-white/80 text-sm mb-8">Carefully curated summer essentials at exceptional prices. Limited stock available.</p>
              <button
                onClick={() => navigate('/products')}
                className="px-8 py-3.5 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                Shop the Sale
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2">Just In</p>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link to="/products?new=true" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── Bestsellers ── */}
      <section className="py-20">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2">Customer Favourites</p>
              <h2 className="section-title">Best Sellers</h2>
            </div>
            <Link to="/products?bestseller=true" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-20 bg-[#F9F5F0]">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2">Testimonials</p>
            <h2 className="section-title">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-6 shadow-card">
                <RatingStars rating={review.rating} showCount={false} size="sm" />
                <p className="text-sm text-gray-600 mt-3 mb-4 leading-relaxed">"{review.comment}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <img src={review.avatar} alt={review.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                    <p className="text-xs text-gray-400">{review.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-20 bg-gray-900">
        <div className="container-custom text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Stay in the Loop</p>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Get Exclusive Access</h2>
          <p className="text-gray-400 text-sm mb-8">Subscribe to receive early access to new collections, exclusive offers, and style inspiration.</p>
          <form onSubmit={e => { e.preventDefault(); setEmail(''); }} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-5 py-3.5 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500"
              required
            />
            <button type="submit" className="px-6 py-3.5 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
          <p className="text-xs text-gray-600 mt-4">No spam. Unsubscribe at any time.</p>
        </div>
      </section>
    </Layout>
  );
};
