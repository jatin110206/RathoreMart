import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { categories } from '../../data/products';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, toggleCart } = useCart();
  const { state: wishlistState } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gray-900 text-white text-xs text-center py-2.5 px-4">
        <span className="font-medium">Free shipping on orders above ₹999</span>
        <span className="mx-3 opacity-40">|</span>
        <span>Use code <strong>KHAREEDLO10</strong> for 10% off your first order</span>
      </div>

      {/* Main Navbar */}
      <nav className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${isScrolled ? 'shadow-soft' : 'border-b border-gray-100'}`}>
        <div className="container-custom">
          <div className="flex items-center h-16 gap-4">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden btn-ghost p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="font-display text-2xl font-bold text-gray-900 tracking-tight">
                rathoreMart
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1 ml-6">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Search Bar — Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center flex-1 max-w-xs ml-auto"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
                />
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-1 ml-2">
              {/* Mobile Search */}
              <button
                className="md:hidden btn-ghost p-2"
                onClick={() => navigate('/search')}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              <Link
                to={isAuthenticated ? '/account' : '/auth'}
                className="btn-ghost p-2 hidden sm:flex relative"
                title={isAuthenticated ? user?.name : 'Sign In'}
              >
                {isAuthenticated && user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>

              {/* Wishlist */}
              <Link to="/wishlist" className="btn-ghost p-2 relative hidden sm:flex">
                <Heart className="w-5 h-5" />
                {wishlistState.items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistState.items.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={toggleCart} className="btn-ghost p-2 relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-fade-in">
            <div className="container-custom py-4 space-y-1">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  {cat.name}
                </Link>
              ))}
              <hr className="my-2" />
              <Link to={isAuthenticated ? '/account' : '/auth'} className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">
                <User className="w-4 h-4 mr-3" /> {isAuthenticated ? 'My Account' : 'Sign In'}
              </Link>
              <Link to="/wishlist" className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">
                <Heart className="w-4 h-4 mr-3" /> Wishlist {wishlistState.items.length > 0 && `(${wishlistState.items.length})`}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
