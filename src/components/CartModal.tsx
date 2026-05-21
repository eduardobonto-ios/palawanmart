/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { products as mockProducts } from '../mockData';
import { X, ShoppingBag, Trash2, ArrowRight, Plus, Minus, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, products, checkout, currentUser, setIsLoginModalOpen, profiles } = useApp();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [addressError, setAddressError] = React.useState(false);

  // Group cart items by vendorId to compute delivery fees (₱50 per seller)
  const cartItemsBySeller = React.useMemo(() => {
    const groups: { [vendorId: string]: { sellerName: string; items: typeof cart } } = {};
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const vendorId = product.vendorId || 'other';
        if (!groups[vendorId]) {
          const vendorProfile = profiles?.find(p => p.id === vendorId);
          const sellerName = vendorProfile?.display_name2 || vendorProfile?.display_name || 'Seller';
          groups[vendorId] = {
            sellerName,
            items: []
          };
        }
        groups[vendorId].items.push(item);
      }
    });
    
    return groups;
  }, [cart, products, profiles]);

  const uniqueSellers = Object.keys(cartItemsBySeller);
  const deliveryFee = uniqueSellers.length * 50;
  const grandTotal = cartTotal + deliveryFee;

  React.useEffect(() => {
    if (currentUser?.delivery_address) {
      setDeliveryAddress(currentUser.delivery_address);
    }
  }, [currentUser]);

  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Show indicator if there's more to scroll (more than 20px of content hidden below)
      const hasMore = scrollHeight > clientHeight + scrollTop + 20;
      setShowScrollIndicator(hasMore);
    }
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [cart]);

  const handleCheckout = async () => {
    if (!currentUser) {
      onClose();
      setIsLoginModalOpen(true);
      return;
    }

    if (!deliveryAddress.trim()) {
      setAddressError(true);
      return;
    }
    
    setIsCheckingOut(true);
    try {
      await checkout(deliveryAddress);
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 sm:right-4 sm:top-4 sm:bottom-4 w-full sm:max-w-md bg-white/80 sm:bg-white/60 backdrop-blur-2xl z-[70] shadow-2xl flex flex-col sm:rounded-[3rem] border-l sm:border border-white/40 overflow-hidden"
          >
            <div className="p-5 sm:p-8 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-emerald-600" size={24} />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-emerald-900">Your Cart</h2>
                <span className="bg-emerald-100 text-emerald-600 text-xs px-2.5 py-1 rounded-full font-black">
                  {cart.length}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-all text-emerald-900">
                <X size={24} />
              </button>
            </div>

            <div className="relative flex-1 flex flex-col overflow-hidden">
              <div 
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-8"
              >
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200">
                      <ShoppingBag size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-emerald-900">Your cart is empty</p>
                      <p className="text-sm text-emerald-600/60 max-w-[200px] mx-auto">Looks like you haven't added any local gems yet.</p>
                    </div>
                    <button 
                      onClick={onClose}
                      className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/20"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  Object.keys(cartItemsBySeller).map(vendorId => {
                    const group = cartItemsBySeller[vendorId];
                    const sellerSubtotal = group.items.reduce((sum, item) => {
                      const prod = products.find(p => p.id === item.productId);
                      return sum + (prod ? prod.price * item.quantity : 0);
                    }, 0);
                    
                    return (
                      <div key={vendorId} className="bg-emerald-900/[0.03] backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-emerald-900/5 space-y-4 shadow-sm animate-in fade-in-50 duration-300">
                        {/* Seller Group Header */}
                        <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                            <h4 className="font-black text-xs sm:text-sm text-emerald-950 truncate">{group.sellerName}</h4>
                          </div>
                          <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0 border border-emerald-100">
                            ₱50 delivery fee
                          </span>
                        </div>

                        {/* Seller Items */}
                        <div className="space-y-4">
                          {group.items.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;
                            return (
                              <div key={item.productId} className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100 shadow-inner">
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                  <div>
                                    <h5 className="font-bold text-xs sm:text-sm text-emerald-900 truncate leading-tight">{product.name}</h5>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mt-1">{product.category}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="font-black text-xs sm:text-sm text-emerald-700">₱{(product.price * item.quantity).toLocaleString()}</span>
                                    <div className="flex items-center bg-emerald-50/80 rounded-xl p-1 gap-2 shadow-inner border border-emerald-100">
                                       <button 
                                         onClick={() => updateQuantity(item.productId, -1)}
                                         className="w-5 h-5 flex items-center justify-center text-emerald-600 hover:bg-white rounded-lg transition-all active:scale-95"
                                       >
                                          <Minus size={11} strokeWidth={3} />
                                       </button>
                                       <span className="text-xs font-black text-emerald-950 w-4 text-center">{item.quantity}</span>
                                       <button 
                                         onClick={() => updateQuantity(item.productId, 1)}
                                         className="w-5 h-5 flex items-center justify-center bg-emerald-600 text-white rounded-lg transition-all shadow-sm active:scale-95"
                                       >
                                          <Plus size={11} strokeWidth={3} />
                                       </button>
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.productId)}
                                  className="p-1.5 text-emerald-300 hover:text-red-500 transition-colors self-center"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Seller Total Summary Row */}
                        <div className="pt-3 border-t border-emerald-900/5 flex justify-between items-center text-[11px] sm:text-xs">
                          <div className="flex flex-col text-left">
                            <span className="text-emerald-500 font-bold uppercase tracking-widest text-[9px]">Seller Subtotal</span>
                            <span className="text-[9px] text-emerald-400 font-medium">Items + ₱50 delivery fee</span>
                          </div>
                          <span className="font-black text-emerald-900 text-xs sm:text-sm">₱{(sellerSubtotal + 50).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Scroll Indicator */}
              <AnimatePresence>
                {showScrollIndicator && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
                  >
                    <div className="bg-primary text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-xl shadow-primary/40 flex items-center gap-2 animate-bounce">
                      <span>There's more in your parcel</span>
                      <ArrowRight size={10} className="rotate-90" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {cart.length > 0 && (
              <div className="p-3 sm:p-5 bg-emerald-900/5 backdrop-blur-md border-t border-white/20 space-y-2 sm:space-y-3">
                <div className="space-y-1.5 bg-white/40 p-2.5 sm:p-3 rounded-xl border border-white/60">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-800">Subtotal</span>
                    <span className="text-emerald-900">₱{cartTotal.toLocaleString()}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-800">Delivery Fee</span>
                        <span className="text-[8px] text-emerald-500 tracking-wider bg-emerald-50 px-1 py-0.5 rounded border border-emerald-150">
                          ₱50 × {uniqueSellers.length} seller{uniqueSellers.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-emerald-900">₱{deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-emerald-900/10 my-1" />
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-emerald-900 font-black">Total Amount</span>
                    <span className="text-sm sm:text-lg font-black text-emerald-900 tracking-tight">₱{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-white/40 p-2 sm:p-2.5 rounded-xl border border-white/60">
                   <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                      <MapPin size={12} className="sm:w-4 sm:h-4" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[7px] sm:text-[8px] font-black text-emerald-900 uppercase tracking-widest leading-none mb-0.5">Delivery Address</p>
                      <input 
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          setAddressError(false);
                        }}
                        placeholder="Enter your delivery address..."
                        className={`w-full bg-transparent text-[11px] sm:text-xs font-bold text-emerald-900 placeholder:text-emerald-300 focus:outline-none ${addressError ? 'text-red-500' : ''}`}
                      />
                      {addressError && (
                        <p className="text-[7px] font-black text-red-500 uppercase mt-0.5 leading-none">Please enter an address</p>
                      )}
                   </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-emerald-600 text-white py-2.5 sm:py-3 rounded-xl font-black flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/15 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {isCheckingOut ? 'Processing...' : (
                      <>Checkout <ArrowRight size={14} strokeWidth={3} className="sm:w-4 sm:h-4" /></>
                    )}
                  </button>
                  <div className="flex items-center justify-between px-1 text-[9px] sm:text-[10px]">
                     <div className="flex items-center gap-1 text-emerald-600 font-bold">
                       <span>🛡️</span>
                       <span>Secure COD Payment</span>
                     </div>
                     <button 
                       onClick={clearCart}
                       className="text-emerald-400 hover:text-red-500 font-bold uppercase tracking-wider transition-all"
                     >
                       Clear All Items
                     </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
