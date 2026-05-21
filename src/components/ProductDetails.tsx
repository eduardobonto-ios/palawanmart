/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ShoppingCart, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Store,
  MessageCircle,
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Rating } from '../types';

export default function ProductDetails() {
  const { 
    selectedProductId, 
    setSelectedProductId, 
    addToCart, 
    setIsCartOpen, 
    currentUser, 
    setIsLoginModalOpen,
    setIsChatOpen,
    setActiveChatReceiverId,
    setFilterByVendorId,
    products,
    profiles,
    ratings,
    addRating,
    refreshRatings,
    orders
  } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOrdering, setIsOrdering] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoveredScore, setHoveredScore] = useState(0);

  const product = products.find(p => p.id === selectedProductId);
  const productRatings = ratings.filter(r => r.product_id === selectedProductId);
  const averageRating = productRatings.length > 0 
    ? (productRatings.reduce((acc, r) => acc + r.score, 0) / productRatings.length).toFixed(1)
    : "5.0";

  const vendorProfile = profiles.find(v => v.id === product?.vendorId);
  const isOwner = currentUser?.id === product?.vendorId;

  // Check if user can review: must have an order with this product that is 'delivered' or 'payment_received'
  const canReview = currentUser && orders.some(o => 
    o.buyerId === currentUser.id && 
    (o.status === 'delivered' || o.status === 'payment_received') &&
    o.items?.some(item => item.productId === selectedProductId) &&
    !productRatings.some(r => r.user_id === currentUser.id) // Haven't reviewed yet
  );

  const vendor = vendorProfile ? {
    id: vendorProfile.id,
    name: vendorProfile.display_name,
    logo: vendorProfile.photo_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200',
    location: 'Palawan',
    rating: 4.8,
    reviews: 124
  } : null;

  if (!product) return null;

  const handleSubmitReview = async () => {
    if (!currentUser || !selectedProductId) return;
    if (ratingScore === 0) {
      alert("Please select a rating score.");
      return;
    }
    if (!ratingComment.trim()) {
      alert("Please write a comment.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await addRating(selectedProductId, ratingScore, ratingComment.trim());
      setRatingComment('');
      setRatingScore(5);
      alert("Thank you for your review!");
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (isOwner) {
      alert("You cannot add your own product to the cart.");
      return;
    }
    addToCart(product.id);
  };

  const handleBuyNow = () => {
    if (isOwner) {
      alert("You cannot buy your own product.");
      return;
    }
    addToCart(product.id);
    setIsCartOpen(true);
  };

  const handleChat = () => {
    if (isOwner) {
      alert("You cannot message yourself.");
      return;
    }
    if (!currentUser) {
      setIsLoginModalOpen(true);
    } else {
      setActiveChatReceiverId(product.vendorId);
      setIsChatOpen(true);
    }
  };

  const handleViewShop = () => {
    setFilterByVendorId(product.vendorId);
    setSelectedProductId(null);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={() => setSelectedProductId(null)}
        className="flex items-center gap-2 text-emerald-900/60 hover:text-emerald-900 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-emerald-900/5">
        {/* Left: Image Carousel */}
        <div className="space-y-6">
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-emerald-50 group">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {product.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-emerald-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-emerald-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                  currentImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center pt-4">
            <button className="flex items-center gap-2 text-sm font-bold text-emerald-900/60 hover:text-emerald-900 transition-colors">
              <Share2 size={18} />
              Share this product
            </button>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col">
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                Verified Local
              </span>
              <span className="text-emerald-900/40 text-xs font-bold uppercase tracking-wider">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-emerald-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <span className="text-accent font-black border-b-2 border-accent/20 pr-1">{averageRating}</span>
                <div className="flex text-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.floor(Number(averageRating)) ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              <div className="w-px h-4 bg-emerald-100" />
              <div className="flex items-center gap-1">
                <span className="text-emerald-900 font-black border-b-2 border-emerald-900/10">{productRatings.length}</span>
                <span className="text-emerald-900/40 text-xs font-bold">Ratings</span>
              </div>
              <div className="w-px h-4 bg-emerald-100" />
              <div className="flex items-center gap-1">
                <span className="text-emerald-900 font-black">{Math.floor(product.reviewsCount * 2.5) + productRatings.length}</span>
                <span className="text-emerald-900/40 text-xs font-bold">Sold</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-3xl mb-8">
            <span className="text-4xl font-black text-primary tracking-tighter">₱{product.price.toLocaleString()}</span>
          </div>

          <div className="space-y-6 mb-10">
            <div className="flex items-start gap-4">
              <Truck size={20} className="text-emerald-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-emerald-900">Free Shipping</p>
                <p className="text-sm text-emerald-900/60 font-medium">Free shipping for orders over ₱1,000</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-emerald-900">Palawan Guaranteed</p>
                <p className="text-sm text-emerald-900/60 font-medium">Get the item you ordered or get your money back.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <RotateCcw size={20} className="text-emerald-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-emerald-900">7-Day Free Returns</p>
                <p className="text-sm text-emerald-900/60 font-medium">Original condition return policy applies.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-auto">
            {isOwner ? (
              <>
                <button 
                  onClick={handleViewShop}
                  className="col-span-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-50 text-emerald-900 font-black border-2 border-emerald-100 shadow-lg shadow-emerald-900/5 hover:bg-emerald-100 transition-all active:scale-95"
                >
                  <Store size={20} />
                  View Shop
                </button>
                <div className="col-span-1 p-3 bg-emerald-50/50 rounded-2xl text-center flex flex-col justify-center border border-dashed border-emerald-200">
                  <p className="text-emerald-900/40 font-black text-[10px] uppercase tracking-widest leading-none">Your Listing</p>
                  <p className="text-emerald-500 font-black text-[12px] leading-tight mt-1">Live in Store</p>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-primary text-primary font-black hover:bg-primary/5 transition-all active:scale-95"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={isOrdering}
                  className="py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                >
                  {isOrdering ? 'Generating Order...' : 'Buy Now'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Specifications & Vendor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Details */}
          <div className="bg-white rounded-[3rem] p-10 shadow-lg shadow-emerald-900/5">
            <h3 className="text-xl font-black text-emerald-900 mb-8 border-b-2 border-emerald-50 pb-4">Product Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex justify-between border-b border-emerald-50 pb-2">
                <span className="text-emerald-900/40 font-bold uppercase tracking-wider text-xs">Category</span>
                <span className="text-emerald-900 font-bold">{product.category}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-50 pb-2">
                <span className="text-emerald-900/40 font-bold uppercase tracking-wider text-xs">Stock</span>
                <span className="text-emerald-900 font-bold">542</span>
              </div>
              <div className="flex justify-between border-b border-emerald-50 pb-2">
                <span className="text-emerald-900/40 font-bold uppercase tracking-wider text-xs">Ships From</span>
                <span className="text-emerald-900 font-bold">{vendor?.location || 'Palawan'}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-50 pb-2">
                <span className="text-emerald-900/40 font-bold uppercase tracking-wider text-xs">Brand</span>
                <span className="text-emerald-900 font-bold">Local Artisans</span>
              </div>
            </div>

            <h3 className="text-xl font-black text-emerald-900 mt-12 mb-6">Product Description</h3>
            <p className="text-emerald-900/70 font-medium leading-relaxed whitespace-pre-line">
              {product.description}
              {"\n\n"}
              Experience the authentic taste of Palawan with our carefully curated products. 
              Supporting local vendors means supporting the communities of the Last Frontier.
              {"\n\n"}
              • 100% Authentic Local Product
              {"\n"}
              • Freshly Harvested/Crafted
              {"\n"}
              • Sustainable Sourcing
            </p>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-[3rem] p-10 shadow-lg shadow-emerald-900/5">
             <h3 className="text-xl font-black text-emerald-900 mb-8">Product Reviews</h3>
             
             <div className="flex flex-col md:flex-row gap-8 mb-12">
               <div className="flex items-center gap-4">
                 <span className="text-6xl font-black text-primary">{averageRating}</span>
                 <div className="space-y-1">
                   <div className="flex text-accent">
                     {[...Array(5)].map((_, i) => (
                       <Star key={i} size={20} fill={i < Math.floor(Number(averageRating)) ? 'currentColor' : 'none'} />
                     ))}
                   </div>
                   <p className="text-emerald-900/40 text-xs font-bold">{productRatings.length} Total Reviews</p>
                 </div>
               </div>

               {canReview && (
                 <div className="flex-1 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                   <p className="text-sm font-black text-emerald-900 mb-4 uppercase tracking-wider">Write a Review</p>
                   <div className="flex gap-1 mb-4">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <button
                         key={star}
                         onMouseEnter={() => setHoveredScore(star)}
                         onMouseLeave={() => setHoveredScore(0)}
                         onClick={() => setRatingScore(star)}
                         className="transition-transform active:scale-90"
                       >
                         <Star 
                           size={24} 
                           className={star <= (hoveredScore || ratingScore) ? 'text-accent fill-accent' : 'text-emerald-200'}
                         />
                       </button>
                     ))}
                   </div>
                   <textarea
                     value={ratingComment}
                     onChange={(e) => setRatingComment(e.target.value)}
                     placeholder="Share your experience with this product..."
                     className="w-full h-24 p-4 rounded-xl border border-emerald-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none mb-4"
                   />
                   <button
                     onClick={handleSubmitReview}
                     disabled={isSubmittingReview}
                     className="w-full py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                   >
                     {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                   </button>
                 </div>
               )}
             </div>

             <div className="space-y-8">
               {productRatings.length > 0 ? (
                 productRatings.map((review) => (
                   <div key={review.id} className="border-b border-emerald-50 pb-8 last:border-0 last:pb-0">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 border border-emerald-100">
                         {review.user_photo ? (
                           <img src={review.user_photo} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-emerald-900 font-bold text-sm">
                             {review.user_name?.[0]}
                           </div>
                         )}
                       </div>
                       <div>
                         <p className="text-sm font-black text-emerald-900 leading-none mb-1">{review.user_name}</p>
                         <div className="flex text-accent">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} size={10} fill={i < review.score ? 'currentColor' : 'none'} className="stroke-[3px]" />
                           ))}
                         </div>
                       </div>
                       <span className="ml-auto text-[10px] text-emerald-900/30 font-bold">
                         {new Date(review.created_at).toLocaleDateString()}
                       </span>
                     </div>
                     <p className="text-sm text-emerald-900/70 font-medium leading-relaxed">
                       {review.comment}
                     </p>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-12 bg-emerald-50/50 rounded-[2rem] border border-dashed border-emerald-200">
                   <p className="text-emerald-900/40 font-bold italic">No reviews yet for this product.</p>
                   {!canReview && !currentUser && (
                     <p className="text-[10px] text-emerald-900/30 font-bold uppercase tracking-widest mt-2">Sign in to share your thoughts</p>
                   )}
                   {currentUser && !canReview && !isOwner && (
                     <p className="text-[10px] text-emerald-900/30 font-bold uppercase tracking-widest mt-2">Only verified buyers can review</p>
                   )}
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Vendor Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] p-8 shadow-lg shadow-emerald-900/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-50">
                <img src={vendor?.logo} alt={vendor?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="font-black text-emerald-900">{vendor?.name}</h4>
                <p className="text-xs text-emerald-900/60 font-medium italic">Active 5 mins ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center">
                <p className="text-primary font-black">4.8</p>
                <p className="text-[10px] text-emerald-900/40 font-bold uppercase tracking-widest">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-primary font-black">1.2k</p>
                <p className="text-[10px] text-emerald-900/40 font-bold uppercase tracking-widest">Products</p>
              </div>
            </div>

            <div className="space-y-3">
              {!isOwner ? (
                <button 
                  onClick={handleChat}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-all"
                >
                  <MessageCircle size={16} />
                  Chat Now
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-900/40 text-sm font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                  <MessageCircle size={16} />
                  Own Store
                </div>
              )}
              <button 
                onClick={handleViewShop}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-900 text-sm font-bold hover:bg-emerald-100 transition-all"
              >
                <Store size={16} />
                {isOwner ? 'View Your Shop' : 'View Shop'}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-[3rem] p-8 text-white">
            <h4 className="text-lg font-black mb-4">Why Buy Local?</h4>
            <p className="text-emerald-100/70 text-sm leading-relaxed font-medium">
              Every purchase you make directly supports a family in Palawan. 
              We bridge the gap between rural producers and urban consumers.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold leading-tight">
                Secure & Safe Transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
