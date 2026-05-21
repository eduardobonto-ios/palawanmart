/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, removeFromCart, setSelectedProductId, cart } = useApp();
  const isInCart = cart.some(item => item.productId === product.id);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCart) {
      removeFromCart(product.id);
    } else {
      addToCart(product.id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => setSelectedProductId(product.id)}
      className="glass-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden p-2 sm:p-4 group cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden rounded-[1.2rem] sm:rounded-[2rem] bg-emerald-50">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="pt-2 px-1">
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
          {product.category}
        </p>

        <h3 className="text-xs sm:text-base font-bold text-emerald-900 line-clamp-1 mb-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between gap-1">
          <span className="text-sm sm:text-xl font-black text-emerald-900 tracking-tight">₱{product.price.toLocaleString()}</span>
          
          <button 
            onClick={handleCartClick}
            className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-full flex items-center justify-center font-bold transition-all transform active:scale-95 shadow-sm ${
              isInCart 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-emerald-100 hover:bg-primary text-emerald-800 hover:text-white'
            }`}
          >
            <ShoppingCart size={14} className="sm:hidden" />
            <ShoppingCart size={18} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
