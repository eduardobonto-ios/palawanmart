/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Share2,
  Heart,
  Camera,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/uploadImage';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SellerEditor({ onBack }: { onBack: () => void }) {
  const { currentUser, refreshProducts, products: allProducts } = useApp();
  const [activeTab, setActiveTab] = useState<'editor' | 'inventory'>('inventory');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState({
    name: '',
    price: 0,
    category: 'Fresh Produce',
    stock: 1, // Added explicit stock
    description: '',
    images: [] as string[],
    specifications: [
      { label: 'Condition', value: 'New' },
      { label: 'Origin', value: 'Palawan' },
      { label: 'Material/Ingredients', value: 'Natural' },
      { label: 'Brand', value: 'Local' }
    ]
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
      if (error) console.error('Error fetching categories:', error);
    };
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const uploadPromises = Array.from(files).map(file =>
        uploadImageToSupabase(file, 'order-items')
      );
      const urls = await Promise.all(uploadPromises);
      setProduct(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setProduct(prev => {
      const newImages = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: newImages };
    });
    if (currentImageIndex >= product.images.length - 1) {
      setCurrentImageIndex(Math.max(0, product.images.length - 2));
    }
  };

  const updateSpec = (idx: number, value: string) => {
    setProduct(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[idx] = { ...newSpecs[idx], value };
      return { ...prev, specifications: newSpecs };
    });
  };

  const myProducts = allProducts.filter(p => p.vendorId === currentUser?.id);

  const handleSave = async () => {
    if (!currentUser) {
      setErrorMsg('You must be logged in to publish products.');
      return;
    }

    if (!product.name || product.price <= 0 || product.images.length === 0) {
      setErrorMsg('Please provide a name, price, and at least one image.');
      return;
    }

    if (!supabase) {
      setErrorMsg('Database connection not available. Check your Supabase configuration in environment variables.');
      console.error('[SellerEditor] Supabase client is null. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    // Ensure seller profile exists before inserting product to satisfy foreign key constraints
    try {
      // Use upsert to avoid duplicate email constraint violations
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          display_name: currentUser.name,
          display_name2: currentUser.name,
          email: currentUser.email || '',
          photo_url: currentUser.photoURL || null,
          role: currentUser.role || 'vendor',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id' // Conflict on id column
        });

      if (profileError) {
        console.error('[SellerEditor] Failed to upsert seller profile:', profileError);
        setErrorMsg('Unable to sync seller profile before publishing the product.');
        return;
      }
      console.info('[SellerEditor] Seller profile verified/created:', currentUser.id);
    } catch (profileCheckError) {
      console.error('[SellerEditor] Profile sync failed:', profileCheckError);
      setErrorMsg('Unable to verify seller identity before publishing the product.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const selectedCat = categories.find(c => 
        c.name.trim().toLowerCase() === product.category.trim().toLowerCase()
      );
      
      const productPayload = {
        seller_id: currentUser.id,
        category_id: selectedCat?.id || null,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images,
        specifications: product.specifications,
        status: 'active'
      };

      let result;
      if (editingProductId) {
        result = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProductId)
          .select();
      } else {
        result = await supabase
          .from('products')
          .insert(productPayload)
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      await refreshProducts();
      setIsSaving(false);
      setShowSuccess(true);
      
      // Reset form
      setProduct({
        name: '',
        price: 0,
        category: categories[0]?.name || 'Fresh Produce',
        stock: 1,
        description: '',
        images: [],
        specifications: [
          { label: 'Condition', value: 'New' },
          { label: 'Origin', value: 'Palawan' },
          { label: 'Material/Ingredients', value: 'Natural' },
          { label: 'Brand', value: 'Local' }
        ]
      });
      setEditingProductId(null);

      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab('inventory');
      }, 2000);
    } catch (err: any) {
      console.error('Error publishing product:', err);
      setErrorMsg(err.message || 'Failed to publish product. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-emerald-900/60 hover:text-emerald-900 font-bold mb-2 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Marketplace
          </button>
          <h2 className="text-2xl font-black text-emerald-900">Seller Studio</h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-emerald-50 p-1 rounded-xl mr-4">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-900/40 hover:text-emerald-900'}`}
            >
              My Inventory
            </button>
            <button 
              onClick={() => {
                setActiveTab('editor');
                setEditingProductId(null);
                setProduct({
                  name: '',
                  price: 0,
                  category: categories[0]?.name || 'Fresh Produce',
                  stock: 1,
                  description: '',
                  images: [],
                  specifications: [
                    { label: 'Condition', value: 'New' },
                    { label: 'Origin', value: 'Palawan' },
                    { label: 'Material/Ingredients', value: 'Natural' },
                    { label: 'Brand', value: 'Local' }
                  ]
                });
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'editor' && !editingProductId ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-900/40 hover:text-emerald-900'}`}
            >
              Add New
            </button>
          </div>
          {activeTab === 'editor' && (
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black transition-all active:scale-95 shadow-lg w-full sm:w-auto ${
                (isSaving || isUploading) ? 'bg-emerald-100 text-emerald-400' : 'bg-primary text-white shadow-primary/20 hover:shadow-xl'
              }`}
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : <Save size={20} />}
              {isUploading ? 'Uploading Image...' : isSaving ? 'Saving...' : (editingProductId ? 'Update Listing' : 'Publish Product')}
            </button>
          )}
          {editingProductId && activeTab === 'editor' && (
            <button 
              onClick={() => {
                setEditingProductId(null);
                setActiveTab('inventory');
              }}
              className="text-emerald-900/40 hover:text-red-500 font-black text-xs uppercase tracking-widest px-4"
            >
              Discard Changes
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm"
          >
            <AlertCircle size={20} />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTab === 'inventory' ? (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-900/5">
              <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-3">
                <Store className="text-primary" />
                Live Listings
                <span className="text-xs bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full font-bold ml-auto">{myProducts.length} Items</span>
              </h3>
              
              {myProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProducts.map(p => (
                    <div key={p.id} className="bg-emerald-50/30 border border-emerald-50 rounded-[2rem] overflow-hidden group">
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={p.images[0]} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-900 uppercase tracking-widest shadow-sm">
                          {p.category}
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="font-black text-emerald-900 mb-1 truncate">{p.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-primary font-black">₱{p.price.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">Stock: {p.stock}</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={() => {
                              setProduct({
                                name: p.name,
                                price: p.price,
                                category: p.category,
                                stock: p.stock,
                                description: p.description,
                                images: p.images,
                                specifications: p.specifications
                              });
                              setEditingProductId(p.id);
                              setActiveTab('editor');
                            }}
                            className="flex-1 py-2 bg-white text-emerald-900 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={async () => {
                              if (!supabase) return;
                              const { error } = await supabase.from('products').delete().eq('id', p.id);
                              if (!error) refreshProducts();
                            }}
                            className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Empty State */}
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-emerald-50 rounded-3xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full text-emerald-200 mb-4">
                      <ShoppingCart size={32} />
                    </div>
                    <h4 className="text-lg font-black text-emerald-900 mb-1">No products yet</h4>
                    <p className="text-emerald-900/40 text-sm font-medium mb-6">Start selling your Palawan treasures today!</p>
                    <button 
                      onClick={() => setActiveTab('editor')}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-black hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      Create First Listing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
        {/* Editor Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />

        {/* Left: Image Carousel / Upload */}
        <div className="space-y-6">
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-emerald-50 group flex items-center justify-center">
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                <Loader2 size={40} className="text-primary animate-spin mb-3" />
                <p className="font-black text-emerald-900 text-sm">Uploading...</p>
              </div>
            )}
            {product.images.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={product.images[currentImageIndex]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <button
                  onClick={() => removeImage(currentImageIndex)}
                  className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Camera size={40} />
                </div>
                <p className="font-black text-emerald-900 mb-1">Add Product Photos</p>
                <p className="text-sm text-emerald-900/40 font-medium">Clear photos attract more buyers</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-6 px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold shadow-sm border border-emerald-100 hover:border-primary transition-all disabled:opacity-50"
                >
                  Choose Images
                </button>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />

            {product.images.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-emerald-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev + 1) % product.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-emerald-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-emerald-300 hover:text-primary hover:border-primary transition-all shrink-0 bg-emerald-50/20 disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={24} />}
              <span className="text-[10px] font-bold">{isUploading ? '...' : 'Add'}</span>
            </button>
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                  currentImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
            <button className="flex items-center gap-2 text-sm font-bold text-emerald-900/60 transition-colors cursor-default opacity-50">
              <Heart size={18} />
              Favorite (Buyer Feed)
            </button>
            <div className="w-px h-4 bg-emerald-100" />
            <button className="flex items-center gap-2 text-sm font-bold text-emerald-900/60 transition-colors cursor-default opacity-50">
              <Share2 size={18} />
              Share (Buyer Feed)
            </button>
          </div>
        </div>

        {/* Right: Product Info Editing */}
        <div className="flex flex-col">
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                Verified Seller
              </span>
              <select 
                value={product.category}
                onChange={(e) => setProduct(prev => ({ ...prev, category: e.target.value }))}
                className="bg-transparent text-emerald-900/40 text-xs font-bold uppercase tracking-wider outline-none border-b border-transparent hover:border-emerald-200 focus:border-primary transition-all"
              >
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                ) : (
                  <>
                    <option>Fresh Produce</option>
                    <option>Clothing & Apparel</option>
                    <option>Handicrafts</option>
                    <option>Packaged Food</option>
                    <option>Souvenirs</option>
                    <option>Wellness</option>
                  </>
                )}
              </select>
            </div>

            <div className="relative group">
              <input 
                type="text"
                value={product.name}
                onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-3xl md:text-4xl font-black text-emerald-900 tracking-tight leading-tight bg-transparent border-b-2 border-transparent hover:border-emerald-100 focus:border-primary outline-none py-1 transition-all"
                placeholder="Product Name"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-100 group-hover:text-emerald-200">
                <Plus size={20} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <span className="text-accent font-black border-b-2 border-accent/20 pr-1">5.0</span>
                <div className="flex text-accent">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                </div>
              </div>
              <div className="w-px h-4 bg-emerald-100" />
              <div className="flex items-center gap-1">
                <span className="text-emerald-900 font-black border-b-2 border-emerald-900/10">0</span>
                <span className="text-emerald-900/40 text-xs font-bold">Ratings</span>
              </div>
              <div className="w-px h-4 bg-emerald-100" />
              <div className="flex items-center gap-1">
                <span className="text-emerald-900 font-black">0</span>
                <span className="text-emerald-900/40 text-xs font-bold">Sold</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-3xl mb-4 relative">
            <div className="flex items-center gap-1">
              <span className="text-4xl font-black text-primary tracking-tighter">₱</span>
              <input 
                type="number"
                value={product.price || ''}
                onChange={(e) => setProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full text-4xl font-black text-primary tracking-tighter bg-transparent outline-none p-0"
                placeholder="0"
              />
            </div>
            <div className="absolute top-2 right-4 text-[10px] font-black text-emerald-300 uppercase tracking-widest">
              Price
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl mb-8 relative">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                Unit Stock
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setProduct(prev => ({ ...prev, stock: Math.max(0, prev.stock - 1) }))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:shadow-md transition-shadow"
                >
                  <Plus size={16} className="rotate-45" />
                </button>
                <input 
                  type="number" 
                  value={product.stock}
                  onChange={(e) => setProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center font-black text-emerald-900 bg-transparent outline-none"
                />
                <button 
                  onClick={() => setProduct(prev => ({ ...prev, stock: prev.stock + 1 }))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:shadow-md transition-shadow"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            <div className="flex items-start gap-4 opacity-100">
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
                <p className="text-sm text-emerald-900/60 font-medium">Buyer protection enabled by default.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <RotateCcw size={20} className="text-emerald-500 shrink-0 mt-1" />
              <div>
                <p className="font-bold text-emerald-900">7-Day Free Returns</p>
                <p className="text-sm text-emerald-900/60 font-medium">Standard return policy applies.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-emerald-100 text-emerald-200 font-black cursor-not-allowed">
              <ShoppingCart size={20} />
              Add to Cart
            </div>
            <div className="flex items-center justify-center py-4 rounded-2xl bg-emerald-900/20 text-emerald-900/30 font-black cursor-not-allowed">
              Buy Now
            </div>
            <p className="col-span-2 text-center text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Buyer View Preview</p>
          </div>
        </div>
      </div>

      {/* Product Specifications & Description Editing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 shadow-lg shadow-emerald-900/5">
            <h3 className="text-xl font-black text-emerald-900 mb-8 border-b-2 border-emerald-50 pb-4">Edit Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {product.specifications.map((spec, idx) => (
                <div key={idx} className="flex flex-col gap-1 border-b border-emerald-50 pb-2 transition-all focus-within:border-primary">
                  <span className="text-emerald-900/40 font-bold uppercase tracking-wider text-[10px]">{spec.label}</span>
                  <input 
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(idx, e.target.value)}
                    className="text-emerald-900 font-bold bg-transparent outline-none"
                  />
                </div>
              ))}
            </div>

            <h3 className="text-xl font-black text-emerald-900 mt-12 mb-6">Edit Description</h3>
            <textarea 
              value={product.description}
              onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
              rows={8}
              className="w-full text-emerald-900/70 font-medium leading-relaxed bg-emerald-50/30 rounded-2xl p-4 border border-transparent focus:border-primary focus:bg-white outline-none transition-all resize-none"
              placeholder="Tell buyers more about your product..."
            />
            <div className="mt-4 p-4 border-l-2 border-emerald-100 bg-emerald-50/50 rounded-r-xl">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Pro Tip</p>
              <p className="text-xs text-emerald-800/60 font-medium">Buyers love details! Mention origin, ingredients, or how it's made.</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-lg shadow-emerald-900/5 opacity-50 relative group">
             <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-[3rem]">
               <span className="bg-white px-6 py-2 rounded-full font-black text-emerald-900 shadow-xl border border-emerald-50">Empty State Preview</span>
             </div>
             <h3 className="text-xl font-black text-emerald-900 mb-8">Product Reviews</h3>
             <p className="text-emerald-900/40 font-bold italic">No reviews yet for new listings.</p>
          </div>
        </div>

        {/* Profile Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] p-8 shadow-lg shadow-emerald-900/5">
            <h4 className="font-black text-emerald-900 mb-6 border-b border-emerald-50 pb-2">Your Shop Stats</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 bg-emerald-50/50 rounded-2xl">
                <p className="text-primary font-black">5.0</p>
                <p className="text-[10px] text-emerald-900/40 font-bold uppercase tracking-widest">Rating</p>
              </div>
              <div className="text-center p-4 bg-emerald-50/50 rounded-2xl">
                <p className="text-primary font-black">12</p>
                <p className="text-[10px] text-emerald-900/40 font-bold uppercase tracking-widest">Live Items</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-100 text-emerald-200 text-sm font-bold cursor-not-allowed">
                <MessageCircle size={16} />
                Chat Now
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-900 text-sm font-bold hover:bg-emerald-100 transition-all">
                <Store size={16} />
                Visit Your Shop
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-[3rem] p-8 text-white relative overflow-hidden group">
            <motion.div 
              className="absolute -right-4 -bottom-4 text-white/5"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <ShoppingCart size={120} />
            </motion.div>
            <h4 className="text-lg font-black mb-4 relative z-10">Selling Checklist</h4>
            <ul className="space-y-3 relative z-10">
              <li className="flex items-center gap-2 text-xs font-bold text-emerald-100/90">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${product.images.length > 0 ? 'bg-emerald-400' : 'bg-white/20'}`}>
                  {product.images.length > 0 && <CheckCircle size={10} />}
                </div>
                At least 1 photo
              </li>
              <li className="flex items-center gap-2 text-xs font-bold text-emerald-100/90">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${product.price > 0 ? 'bg-emerald-400' : 'bg-white/20'}`}>
                  {product.price > 0 && <CheckCircle size={10} />}
                </div>
                Valid Price
              </li>
              <li className="flex items-center gap-2 text-xs font-bold text-emerald-100/90">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${product.description.length > 20 ? 'bg-emerald-400' : 'bg-white/20'}`}>
                  {product.description.length > 20 && <CheckCircle size={10} />}
                </div>
                Detailed Description
              </li>
            </ul>
          </div>
        </div>
      </div>
      </motion.div>
    )}
    </AnimatePresence>
  </div>
);
}
