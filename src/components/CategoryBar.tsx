/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Apple, Palette, Package, Gift, Sparkles, Shirt, ChevronLeft, ChevronRight } from 'lucide-react';
import { categories } from '../mockData';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

const iconMap: { [key: string]: any } = {
  Apple,
  Palette,
  Package,
  Gift,
  Sparkles,
  Shirt
};

export default function CategoryBar() {
  const { selectedCategory, setSelectedCategory } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="sticky top-[72px] md:top-[96px] z-40 bg-background-start/80 backdrop-blur-md border-b border-white/10 relative group">
      {/* Navigation Buttons */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/90 hover:bg-white text-emerald-900 rounded-full shadow-lg border border-white lg:opacity-0 lg:group-hover:opacity-100 transition-opacity active:scale-90"
      >
        <ChevronLeft size={16} className="md:w-5 md:h-5" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/90 hover:bg-white text-emerald-900 rounded-full shadow-lg border border-white lg:opacity-0 lg:group-hover:opacity-100 transition-opacity active:scale-90"
      >
        <ChevronRight size={16} className="md:w-5 md:h-5" />
      </button>

      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto no-scrollbar scroll-smooth"
      >
        <div className="flex gap-3 md:gap-4 flex-nowrap min-w-max justify-start md:justify-center px-4 md:px-8 py-3 md:py-4 items-center">
          {categories.map((category, index) => {
            const Icon = iconMap[category.icon] || Package;
            const isActive = selectedCategory === category.name;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(isActive ? null : category.name)}
                className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-2xl group cursor-pointer transition-all shrink-0 active:scale-95 select-none ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-emerald-900/10 scale-105' 
                    : 'bg-white/40 backdrop-blur-sm border border-white hover:bg-white text-emerald-900/70 hover:text-emerald-900'
                }`}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-primary group-hover:bg-primary group-hover:text-white'
                }`}>
                  <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                </div>
                <span className={`text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${
                  isActive ? 'text-white' : ''
                }`}>
                  {category.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
