import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductCard';
import { products } from '../data/products';

const popularSearches = ['Cashmere Coat', 'Silk Dress', 'Leather Bag', 'Denim Jeans', 'Sneakers', 'Watch'];
const recentSearches = ['Blazer', 'Merino Sweater', 'Accessories'];

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(!!initialQ);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { setSubmitted(true); navigate(`/search?q=${encodeURIComponent(query.trim())}`); }
  };

  const doSearch = (q: string) => {
    setQuery(q);
    setSubmitted(true);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <Layout>
      <div className="container-custom py-10">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSubmitted(false); }}
              placeholder="Search for products, brands, categories..."
              className="w-full pl-14 pr-14 py-4 text-base border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-soft"
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSubmitted(false); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* No query — show suggestions */}
        {!submitted && !query && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(s => (
                  <button key={s} onClick={() => doSearch(s)} className="px-4 py-2 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Popular Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map(s => (
                  <button key={s} onClick={() => doSearch(s)} className="px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-full hover:border-gray-400 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {submitted && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {results.length > 0 ? <><strong className="text-gray-900">{results.length}</strong> results for "<em>{query}</em>"</> : `No results for "${query}"`}
              </p>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {results.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-sm text-gray-500 mb-6">Try different keywords or browse our categories</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {popularSearches.map(s => (
                    <button key={s} onClick={() => doSearch(s)} className="px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-full hover:border-gray-400 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
