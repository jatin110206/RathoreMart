import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutList } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/product/ProductCard';
import { products, categories } from '../data/products';
import { FilterState } from '../types';

const brands = [...new Set(products.map(p => p.brand))];
const allSizes = [...new Set(products.flatMap(p => p.sizes))];

const defaultFilters: FilterState = {
  categories: [], brands: [], minPrice: 0, maxPrice: 80000,
  sizes: [], colors: [], ratings: [], inStockOnly: false,
};

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

export const ProductListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const isBestseller = searchParams.get('bestseller') === 'true';
  const isNew = searchParams.get('new') === 'true';

  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    categories: categoryParam ? [categoryParam] : [],
  });
  const [sort, setSort] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    if (categoryParam) setFilters(f => ({ ...f, categories: [categoryParam] }));
  }, [categoryParam]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (isBestseller) result = result.filter(p => p.isBestseller);
    if (isNew) result = result.filter(p => p.isNew);
    if (filters.categories.length) result = result.filter(p => filters.categories.includes(p.category));
    if (filters.brands.length) result = result.filter(p => filters.brands.includes(p.brand));
    if (filters.sizes.length) result = result.filter(p => p.sizes.some(s => filters.sizes.includes(s)));
    if (filters.inStockOnly) result = result.filter(p => p.inStock);
    result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    if (filters.ratings.length) result = result.filter(p => filters.ratings.some(r => p.rating >= r));

    switch (sort) {
      case 'price-asc': return result.sort((a, b) => a.price - b.price);
      case 'price-desc': return result.sort((a, b) => b.price - a.price);
      case 'newest': return result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      case 'rating': return result.sort((a, b) => b.rating - a.rating);
      case 'popular': return result.sort((a, b) => b.reviewCount - a.reviewCount);
      default: return result;
    }
  }, [filters, sort, isBestseller, isNew]);

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const activeFilterCount = filters.categories.length + filters.brands.length + filters.sizes.length + (filters.inStockOnly ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.id)}
                onChange={() => setFilters(f => ({ ...f, categories: toggle(f.categories, cat.id) }))}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Brand</h4>
        <div className="space-y-2">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => setFilters(f => ({ ...f, brands: toggle(f.brands, brand) }))}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h4>
        <div className="space-y-3">
          <input
            type="range" min={0} max={80000} step={500}
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
            className="w-full accent-gray-900"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹0</span>
            <span>Up to ₹{filters.maxPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Size</h4>
        <div className="flex flex-wrap gap-2">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
            <button
              key={size}
              onClick={() => setFilters(f => ({ ...f, sizes: toggle(f.sizes, size) }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                filters.sizes.includes(size) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2].map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.ratings.includes(r)}
                onChange={() => setFilters(f => ({ ...f, ratings: toggle(f.ratings.map(String), String(r)).map(Number) }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{'★'.repeat(r)} & above</span>
            </label>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={e => setFilters(f => ({ ...f, inStockOnly: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700">In Stock Only</span>
      </label>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button
          onClick={() => setFilters(defaultFilters)}
          className="w-full btn-secondary py-2 text-sm"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  const title = categoryParam
    ? categories.find(c => c.id === categoryParam)?.name || 'Products'
    : isBestseller ? 'Best Sellers' : isNew ? 'New Arrivals' : 'All Products';

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} products</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile Filter */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 btn-secondary px-4 py-2 text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white cursor-pointer"
              >
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="badge bg-gray-900 text-white">{activeFilterCount}</span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Grid3X3 className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
                <button onClick={() => setFilters(defaultFilters)} className="btn-primary mt-6">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filtered.slice(0, visibleCount).map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {visibleCount < filtered.length && (
                  <div className="text-center mt-12">
                    <button onClick={() => setVisibleCount(v => v + 12)} className="btn-secondary px-10">
                      Load More ({filtered.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setIsFilterOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setIsFilterOpen(false)} className="btn-primary w-full mt-6">
              Apply Filters
            </button>
          </div>
        </>
      )}
    </Layout>
  );
};
