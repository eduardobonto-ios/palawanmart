/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategoryBar from './components/CategoryBar';
import ProductCard from './components/ProductCard';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Store } from 'lucide-react';
import { useApp } from './context/AppContext';

type Page = 'home' | 'products' | 'cart' | 'vendor' | 'admin' | 'dashboard' | 'sell';

import CartModal from './components/CartModal';
import Dashboard from './components/Dashboard';
import ProductDetails from './components/ProductDetails';
import SellerEditor from './components/SellerEditor';
import LoginModal from './components/LoginModal';
import ChatPopup from './components/ChatPopup';

export default function App() {
  const [visibleCount, setVisibleCount] = useState(10);
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'orders' | 'inventory' | 'earnings' | 'settings'>('overview');
  const {
    products: allProducts,
    isLoadingProducts,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    selectedProductId,
    setSelectedProductId,
    currentPage,
    setCurrentPage,
    isCartOpen,
    setIsCartOpen,
    filterByVendorId,
    setFilterByVendorId,
    currentUser
  } = useApp();

  // Reset visible count when category, search, or vendor changes
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedCategory, searchQuery, filterByVendorId]);

  const filteredProducts = allProducts.filter(product => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesVendor = !filterByVendorId || product.vendorId === filterByVendorId;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && matchesVendor;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleGoHome = () => {
    setCurrentPage('home');
    setSelectedProductId(null);
    setFilterByVendorId(null);
  };

  const handleGoDashboard = (tab?: 'overview' | 'orders' | 'inventory' | 'earnings' | 'settings') => {
    setDashboardTab(tab || 'overview');
    setCurrentPage('dashboard');
    setSelectedProductId(null);
  };

  const handleSell = () => {
    setCurrentPage('sell');
    setSelectedProductId(null);
  };

  const currentRole = currentUser?.role || 'customer';

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-clip">
      <Navbar 
        onGoHome={handleGoHome} 
        onGoDashboard={(tab) => handleGoDashboard(tab)}
        onSell={handleSell}
      />
      
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      <main className="flex-grow">
        <LoginModal />
        <ChatPopup />
        <AnimatePresence mode="wait">
          {selectedProductId ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProductDetails />
            </motion.div>
          ) : currentPage === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <Dashboard role={currentRole} initialTab={dashboardTab} />
            </motion.div>
          ) : currentPage === 'sell' ? (
            <motion.div
              key="sell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SellerEditor onBack={() => setCurrentPage('home')} />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0"
            >
              {/* Shop Filter Banner */}
              {filterByVendorId && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 bg-primary text-white rounded-[2rem] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Store />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">Viewing Shop Content</h3>
                      <p className="text-xs font-bold text-white/60">Showing all items from this local artisan.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFilterByVendorId(null)}
                    className="px-6 py-2 bg-white text-primary rounded-xl font-black text-xs hover:scale-105 transition-all shadow-lg"
                  >
                    Show All Sellers
                  </button>
                </motion.div>
              )}

              <CategoryBar />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
                <section>
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-4xl font-display font-black text-emerald-900 tracking-tight transition-all">
                        {selectedCategory || 'All Categories'}
                      </h2>
                      <p className="text-emerald-600/60 font-medium">
                        {selectedCategory 
                          ? `Authentic ${selectedCategory} from Palawan's finest vendors.` 
                          : 'Explore our handpicked collection of Palawan treasures.'}
                      </p>
                    </div>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-accent uppercase tracking-widest hover:underline"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>

                  {isLoadingProducts ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="glass-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden p-2 sm:p-4 animate-pulse">
                          <div className="aspect-square rounded-[1.2rem] sm:rounded-[2rem] bg-emerald-100/60" />
                          <div className="pt-3 px-1 space-y-2">
                            <div className="h-2.5 bg-emerald-100/60 rounded-full w-1/3" />
                            <div className="h-4 bg-emerald-100/60 rounded-full w-4/5" />
                            <div className="h-5 bg-emerald-100/60 rounded-full w-1/2 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                        {displayedProducts.map(product => <ProductCard key={product.id} product={product} />)}
                      </div>

                      {hasMore && (
                        <div className="flex justify-center pt-12">
                          <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="group flex items-center gap-3 bg-white border-2 border-emerald-100 hover:border-primary px-10 py-4 rounded-2xl font-black text-emerald-900 shadow-xl shadow-emerald-900/5 transition-all hover:-translate-y-1 active:scale-95"
                          >
                            <span>See More Products</span>
                            <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-300 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                              <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-20 text-center glass rounded-[3rem]">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-200">
                        <ShoppingBag size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-emerald-900 mb-2">No items found</h3>
                      <p className="text-emerald-600/60">
                        {selectedCategory || searchQuery
                          ? 'Try searching for something else or clearing your filters.'
                          : 'No products have been listed yet. Be the first to sell!'}
                      </p>
                      {(selectedCategory || searchQuery) && (
                        <button
                          onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                          className="mt-6 bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
