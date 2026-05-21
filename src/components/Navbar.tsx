/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart, Search, User, Menu, LogOut, Settings, MessageCircle, BarChart3, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onGoHome: () => void;
  onGoDashboard: (tab?: 'overview' | 'orders' | 'inventory' | 'earnings' | 'settings') => void;
  onSell: () => void;
}

export default function Navbar({ onGoHome, onGoDashboard, onSell }: NavbarProps) {
  const { 
    cart, 
    searchQuery, 
    setSearchQuery, 
    setIsCartOpen, 
    currentUser, 
    setIsLoginModalOpen, 
    logout,
    messages,
    setIsChatOpen
  } = useApp();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const unreadCount = messages.filter(m => currentUser && m.receiverId === currentUser.id && !m.isRead).length;

  const handleSellClick = () => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else {
      onSell();
    }
  };

  return (
    <nav className="sticky top-0 z-50 px-2 md:px-8 py-2 md:py-3 select-none">
      <div className="max-w-7xl mx-auto glass rounded-2xl md:rounded-[2rem] px-4 md:px-8">
        <div className="flex justify-between items-center h-14 md:h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-1.5 md:gap-2 cursor-pointer group shrink-0" onClick={onGoHome}>
            <motion.div 
              initial={{ rotate: -10 }}
              whileHover={{ rotate: 10 }}
              className="bg-primary text-white p-1 md:p-1.5 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-primary/20"
            >
              <ShoppingCart size={18} className="md:w-6 md:h-6" />
            </motion.div>
            <span className="hidden sm:inline text-lg md:text-2xl font-bold tracking-tight text-emerald-900 leading-none">
              Palawan<span className="text-primary">Mart</span>
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-0 max-w-md mx-1 md:mx-0">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/60 backdrop-blur-sm border border-emerald-100 rounded-full py-1.5 md:py-2 pl-8 md:pl-10 pr-3 md:pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-[10px] md:text-sm placeholder-emerald-400 text-emerald-900 outline-none"
              />
              <Search className="absolute left-2.5 top-2 md:top-2.5 text-emerald-400 md:w-4 md:h-4" size={14} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-6 font-medium shrink-0">
            {currentUser && (
              <button 
                onClick={() => onGoDashboard()}
                className={`justify-center p-2 md:pl-2.5 md:pr-3 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                  currentUser.role === 'rider' ? 'hidden md:flex bg-indigo-600 text-white shadow-indigo-600/30' : 'flex bg-primary text-white shadow-primary/30'
                } border border-white/10`}
              >
                {currentUser.role === 'rider' ? <Bike size={16} className="shrink-0" /> : <BarChart3 size={16} className="shrink-0" />}
                <span className="hidden md:inline whitespace-nowrap ml-2">
                  {currentUser.role === 'rider' ? 'Rider Hub' : 'Seller Hub'}
                </span>
              </button>
            )}

            {!currentUser && (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden md:block bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-900/10 active:scale-95"
              >
                Login to Sell
              </button>
            )}

            {currentUser && currentUser.role !== 'rider' && (
              <button 
                onClick={onSell}
                className="hidden md:block bg-white hover:bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-100 active:scale-95 shadow-sm"
              >
                Sell Now
              </button>
            )}
            
            <button 
              onClick={() => {
                if (!currentUser) setIsLoginModalOpen(true);
                else setIsChatOpen(true);
              }}
              className="hidden sm:block p-1.5 md:p-2 text-emerald-900 hover:text-primary hover:bg-white/40 rounded-full transition-all relative"
            >
              <MessageCircle size={18} className="md:w-[22px] md:h-[22px]" strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 bg-red-500 text-white text-[8px] md:text-[10px] font-bold w-3 h-3 md:w-4 md:h-4 rounded-full border border-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-1.5 md:p-2 text-emerald-900 hover:text-primary hover:bg-white/40 rounded-full transition-all relative"
            >
              <ShoppingCart size={18} className="md:w-[22px] md:h-[22px]" strokeWidth={2.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 bg-accent text-white text-[8px] md:text-[10px] font-bold w-3 h-3 md:w-4 md:h-4 rounded-full border border-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button 
                onClick={() => !currentUser ? setIsLoginModalOpen(true) : setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-0.5 pr-2 md:p-1 md:pr-3 bg-white/40 hover:bg-white transition-all rounded-full border border-white/60 ring-1 ring-emerald-900/5 group"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={16} className="md:w-[18px] md:h-[18px]" />
                  )}
                </div>
                {currentUser && (
                  <div className="hidden md:flex flex-col items-start leading-none pr-1">
                    <span className="text-[10px] font-black text-emerald-900 truncate max-w-[80px]">{currentUser.name}</span>
                    <span className="text-[8px] font-bold text-emerald-400 truncate max-w-[80px] lowercase">{currentUser.email.split('@')[0]}</span>
                  </div>
                )}
              </button>

              <AnimatePresence>
                {isProfileOpen && currentUser && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-emerald-50 overflow-hidden z-50 py-2"
                    >
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition-all text-left"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onGoDashboard('settings');
                        }}
                      >
                        <User size={16} className="text-emerald-400" />
                        Profile & Settings
                      </button>
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50 transition-all text-left"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onGoDashboard('overview');
                        }}
                      >
                        {currentUser.role === 'rider' ? (
                          <Bike size={16} className="text-indigo-500" />
                        ) : (
                          <BarChart3 size={16} className="text-emerald-400" />
                        )}
                        {currentUser.role === 'rider' ? 'Rider Hub' : 'My Dashboard'}
                      </button>
                      <div className="h-px bg-emerald-50 my-1 mx-2" />
                      <button 
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
