import React from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { RatingStars } from '../ui/RatingStars';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToast } = useToast();

  const wishlisted = isWishlisted(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
    addToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', wishlisted ? 'info' : 'success');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const size = product.sizes[0];
    const color = product.colors[0].name;
    addToCart(product, size, color, 1);
    addToast(`${product.name} added to cart!`, 'success');
  };

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="product-image-container mb-3">
        <img
          src={product.images[0]}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${product.images[1] ? 'group-hover:opacity-0' : ''}`}
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="badge bg-gray-900 text-white">New</span>
          )}
          {product.discount > 0 && (
            <span className="badge bg-red-500 text-white">-{product.discount}%</span>
          )}
          {product.isBestseller && (
            <span className="badge bg-amber-100 text-amber-800">Bestseller</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all duration-200 ${
            wishlisted ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
        </button>

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleQuickAdd}
            className="w-full btn-primary text-xs py-2.5 rounded-xl"
          >
            Quick Add
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <RatingStars rating={product.rating} count={product.reviewCount} />
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
