/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, CartItem, Product, Message, Order, OrderStatus, Rating } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { supabase } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  loginError: string | null;
  setLoginError: (error: string | null) => void;
  products: Product[];
  isLoadingProducts: boolean;
  profiles: any[];
  refreshProducts: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  messages: Message[];
  sendChatMessage: (receiverId: string, content: string, productId?: string) => Promise<void>;
  markMessagesAsRead: (senderId: string) => Promise<void>;
  ratings: Rating[];
  addRating: (productId: string, score: number, comment: string) => Promise<void>;
  refreshRatings: () => Promise<void>;
  orders: Order[];
  createOrder: (sellerId: string, items: { productId: string, quantity: number }[], deliveryAddress: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, riderId?: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  checkout: (deliveryAddress: string) => Promise<void>;
  updateProfile: (data: { name?: string, delivery_address?: string, contact_number?: string }) => Promise<void>;
  changeUserRole: (role: User['role']) => Promise<void>;
  cart: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  currentPage: 'home' | 'products' | 'cart' | 'vendor' | 'admin' | 'dashboard' | 'sell';
  setCurrentPage: (page: 'home' | 'products' | 'cart' | 'vendor' | 'admin' | 'dashboard' | 'sell') => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  activeChatReceiverId: string | null;
  setActiveChatReceiverId: (id: string | null) => void;
  filterByVendorId: string | null;
  setFilterByVendorId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'products' | 'cart' | 'vendor' | 'admin' | 'dashboard' | 'sell'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatReceiverId, setActiveChatReceiverId] = useState<string | null>(null);
  const [filterByVendorId, setFilterByVendorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const refreshProducts = async () => {
    setIsLoadingProducts(true);
    if (!supabase) {
      console.warn('[Supabase] Client not initialized — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setProducts([]);
      setIsLoadingProducts(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`*, categories (name)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        category: p.categories?.name || 'Uncategorized',
        images: Array.isArray(p.images) ? p.images : [],
        vendorId: p.seller_id,
        rating: 5,
        reviewsCount: 0,
        specifications: p.specifications,
        stock: p.stock
      }));

      setProducts(mappedProducts);
    } catch (err) {
      console.error('[refreshProducts] Error fetching products:', err);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const refreshOrders = async (userId?: string) => {
    const idToUse = userId || currentUser?.id || auth.currentUser?.uid;
    if (!supabase || !idToUse) {
      console.warn('[refreshOrders] Cannot refresh orders: supabase=', !!supabase, 'userId=', idToUse);
      return;
    }
    try {
      // Check user role from profiles if not available in state
      let userRole = currentUser?.role;
      if (!userRole && supabase) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', idToUse).single();
        userRole = profile?.role;
      }

      let query = supabase.from('orders').select('*, order_items(*)');

      if (userRole === 'admin') {
        // Admin gets all orders to search and manage
        query = query.order('created_at', { ascending: false });
      } else {
        let filter = `buyer_id.eq.${idToUse},seller_id.eq.${idToUse},rider_id.eq.${idToUse}`;
        if (userRole === 'rider') {
          filter += `,status.eq.ready_for_pickup`;
        }
        query = query.or(filter).order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[refreshOrders] Query error:', error);
        throw error;
      }
      
      if (data) {
        console.info('[refreshOrders] Fetched', data.length, 'orders for user', idToUse);
        setOrders(data.map(o => ({
          id: o.id,
          buyerId: o.buyer_id,
          sellerId: o.seller_id,
          riderId: o.rider_id,
          totalAmount: Number(o.total_amount),
          status: o.status as OrderStatus,
          deliveryAddress: o.delivery_address,
          paymentMethod: o.payment_method,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          items: o.order_items?.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            productId: item.product_id,
            productName: item.product_name,
            productPrice: Number(item.product_price),
            quantity: item.quantity,
            productImage: item.product_image,
            createdAt: item.created_at
          })) || []
        })));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      // ensure UI doesn't hang: if query fails, clear orders to show empty state
      setOrders([]);
    }
  };

  const createOrder = async (sellerId: string, items: { productId: string, quantity: number }[], deliveryAddress: string) => {
    if (!supabase) {
      console.error('[createOrder] Supabase not initialized. Check environment variables.');
      throw new Error('Supabase not configured. Check your Supabase environment variables.');
    }
    if (!currentUser) return;
    
    let totalAmount = 0;
    const orderItemsPayload = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        totalAmount += product.price * item.quantity;
        orderItemsPayload.push({
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: item.quantity,
          product_image: product.images[0] || null
        });
      }
    }
    
    if (orderItemsPayload.length === 0) return;

    const totalWithDelivery = totalAmount + 50;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: currentUser.id,
        seller_id: sellerId,
        total_amount: totalWithDelivery,
        status: 'pending',
        delivery_address: deliveryAddress,
        payment_method: 'COD'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    const fullOrderItems = orderItemsPayload.map(item => ({
      ...item,
      order_id: orderData.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(fullOrderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw itemsError;
    }

    // Notify seller
    try {
      await sendChatMessage(
        sellerId, 
        `New order received! Total: ₱${totalWithDelivery.toLocaleString()} (Includes ₱50 Delivery Fee). Please check your dashboard and confirm the order.`
      );
      console.log('Seller notified via chat');
    } catch (notifyErr) {
      console.error('Failed to notify seller:', notifyErr);
    }

    await refreshOrders(currentUser.id);
  };

  const checkout = async (deliveryAddress: string) => {
    if (!currentUser || cart.length === 0) return;
    
    try {
      if (!supabase) {
        throw new Error('Supabase not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      }

      // Group cart items by vendorId
      const itemsBySeller: { [key: string]: CartItem[] } = {};
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!itemsBySeller[product.vendorId]) {
            itemsBySeller[product.vendorId] = [];
          }
          itemsBySeller[product.vendorId].push(item);
        }
      }

      // Create an order for each seller
      for (const sellerId in itemsBySeller) {
        await createOrder(sellerId, itemsBySeller[sellerId], deliveryAddress);
      }
      
      await clearCart();
      setIsCartOpen(false);
      alert('Order placed successfully! The sellers have been notified.');
    } catch (err) {
      console.error('Checkout failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to place order';
      alert(errorMsg);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, riderId?: string, proofPhoto?: string) => {
    if (!supabase || !currentUser) return;
    
    // Check if the order is already claimed or processed by another rider
    if (riderId || status === 'picked_up') {
      const { data: latestOrder, error: checkError } = await supabase
        .from('orders')
        .select('rider_id, status')
        .eq('id', orderId)
        .single();

      if (!checkError && latestOrder) {
        if (latestOrder.rider_id && latestOrder.rider_id !== currentUser.id) {
          throw new Error('This order has already been accepted by another rider!');
        }
        if (latestOrder.status !== 'ready_for_pickup' && status === 'picked_up') {
          throw new Error('This order is no longer available for pickup.');
        }
      }
    }
    
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (riderId) updateData.rider_id = riderId;
    if (proofPhoto) updateData.proof_photo_url = proofPhoto;

    console.log(`Updating order ${orderId} to status: ${status}`, updateData);
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
       console.error('Error updating order:', error);
       throw error;
    }
    console.log('Order updated successfully in DB');

    // Notify buyer (Optional: remove if user wants strictly manual chat)
    /* 
    const order = orders.find(o => o.id === orderId);
    if (order) {
      if (status === 'confirmed') {
        await sendChatMessage(order.buyerId, `Your order has been confirmed by the seller!`);
      }
      if (status === 'ready_for_pickup') {
        await sendChatMessage(order.buyerId, `Your order is ready for pickup and a rider will collect it soon.`);
      }
      if (status === 'picked_up') {
        await sendChatMessage(order.buyerId, `Your order has been picked up and is on its way!`);
      }
      if (status === 'delivered') {
        await sendChatMessage(order.buyerId, `Your order has been delivered! Please pay and confirm receipt.`);
      }
      if (status === 'payment_received') {
        await sendChatMessage(order.buyerId, `Payment received! Thank you for shopping with PalawanMart.`);
      }
    }
    */

    refreshOrders(currentUser.id);
  };

  const updateProfile = async (data: { name?: string, delivery_address?: string, contact_number?: string }) => {
    if (!supabase || !currentUser) return;
    
    const updateData: any = {};
    if (data.name) {
      updateData.display_name = data.name;
      updateData.display_name2 = data.name;
    }
    if (data.delivery_address !== undefined) updateData.delivery_address = data.delivery_address;
    if (data.contact_number !== undefined) updateData.contact_number = data.contact_number;
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', currentUser.id);
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    setCurrentUser(prev => prev ? { 
      ...prev, 
      name: data.name || prev.name,
      delivery_address: data.delivery_address !== undefined ? data.delivery_address : prev.delivery_address,
      contact_number: data.contact_number !== undefined ? data.contact_number : prev.contact_number
    } : null);
    refreshProfiles();
  };

  const changeUserRole = async (role: User['role']) => {
    if (!supabase || !currentUser) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', currentUser.id);
    
    if (error) {
      console.error('Error changing role:', error);
      throw error;
    }

    setCurrentUser(prev => prev ? { ...prev, role } : null);
    refreshProfiles();
    refreshOrders(currentUser.id);
  };

  const refreshProfiles = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
    if (error) {
      console.error('Error fetching profiles:', error);
      // clear profiles on error to avoid stale state
      setProfiles([]);
    }
  };

  const refreshRatings = async () => {
    if (!supabase) return;
    try {
      // Fetch ratings using a simple query to avoid potential PostgREST foreign key matching/cache issues
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Map ratings using existing profile data or fetch latest profiles to map in memory
      let currentProfiles = profiles;
      if (!currentProfiles || currentProfiles.length === 0) {
        const { data: profilesData } = await supabase.from('profiles').select('*');
        if (profilesData) {
          currentProfiles = profilesData;
          setProfiles(profilesData);
        }
      }

      const profilesMap = new Map<string, any>();
      if (currentProfiles) {
        currentProfiles.forEach(p => {
          profilesMap.set(p.id, p);
        });
      }

      if (ratingsData) {
        setRatings(ratingsData.map(r => {
          const profile = profilesMap.get(r.user_id);
          return {
            id: r.id,
            user_id: r.user_id,
            product_id: r.product_id,
            score: r.score,
            comment: r.comment,
            created_at: r.created_at,
            user_name: profile?.display_name2 || profile?.display_name || 'Anonymous',
            user_photo: profile?.photo_url
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const addRating = async (productId: string, score: number, comment: string) => {
    if (!supabase) return;
    
    // Get fresh session to ensure ID matches RLS expectations
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || currentUser?.id;

    if (!userId) {
      console.error('Cannot add rating: No authenticated user found');
      throw new Error('You must be logged in to rate products.');
    }

    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: userId,
          product_id: productId,
          score: Math.floor(score), // Ensure integer
          comment: comment.trim()
        });

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }
      
      await refreshRatings();
    } catch (err) {
      console.error('Error adding rating:', err);
      throw err;
    }
  };

  const fetchCart = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);
    
    if (data) {
      setCart(data.map(item => ({
        productId: item.product_id,
        quantity: item.quantity
      })));
    }
    if (error) console.error('Error fetching cart:', error);
  };

  const fetchMessages = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        productId: m.product_id,
        createdAt: m.created_at,
        isRead: m.is_read
      })));
    }
    if (error) console.error('Error fetching messages:', error);
  };

  const sendChatMessage = async (receiverId: string, content: string, productId?: string) => {
    if (!supabase || !currentUser) return;
    
    // Optimistic update
    const tempId = Math.random().toString(36).substr(2, 9);
    const optimisticMessage: Message = {
      id: tempId,
      senderId: currentUser.id,
      receiverId: receiverId,
      content: content,
      productId: productId,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMessage]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: receiverId,
        product_id: productId || null,
        content: content
      })
      .select();
    
    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      throw error;
    }

    // Replace optimistic message with real one from DB (to get correct timestamp/id)
    if (data && data[0]) {
      const realMessage = data[0];
      setMessages(prev => prev.map(m => m.id === tempId ? {
        id: realMessage.id,
        senderId: realMessage.sender_id,
        receiverId: realMessage.receiver_id,
        content: realMessage.content,
        productId: realMessage.product_id,
        createdAt: realMessage.created_at,
        isRead: realMessage.is_read
      } : m));
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!supabase || !currentUser) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUser.id)
      .eq('sender_id', senderId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking messages as read:', error);
    } else {
      setMessages(prev => prev.map(m => 
        (m.senderId === senderId && m.receiverId === currentUser.id) 
          ? { ...m, isRead: true } 
          : m
      ));
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshProfiles();
    refreshRatings();
    
    let messageSubscription: any;
    
    const syncProfileToSupabase = async (firebaseUser: any, currentRole?: string) => {
      if (!supabase) return;
      try {
        // Upsert profile to avoid duplicate email constraint violations
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: firebaseUser.uid,
            display_name: firebaseUser.displayName || 'User',
            display_name2: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            photo_url: firebaseUser.photoURL || null,
            role: currentRole || 'customer',
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id' // Conflict on id column, not email
          });

        if (upsertError) {
          console.error('[syncProfileToSupabase] Upsert error:', upsertError);
        } else {
          console.info('[syncProfileToSupabase] Profile synced for', firebaseUser.uid);
        }
      } catch (err) {
        console.error('Unexpected error during profile sync:', err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Fetch existing role from profile or default
        const fetchUserRole = async () => {
          const { data } = await supabase!.from('profiles').select('display_name, display_name2, role, delivery_address, contact_number').eq('id', firebaseUser.uid).single();
          const role = (data?.role || 'customer') as User['role'];
          const delivery_address = data?.delivery_address || undefined;
          const contact_number = data?.contact_number || undefined;
          // Priority: display_name2 (custom) > display_name (sync) > firebase (default)
          const name = data?.display_name2 || data?.display_name || firebaseUser.displayName || 'User';
          
          const userData: User = {
            id: firebaseUser.uid,
            name,
            email: firebaseUser.email || '',
            role,
            photoURL: firebaseUser.photoURL || undefined,
            delivery_address,
            contact_number
          };
          setCurrentUser(userData);
          await syncProfileToSupabase(firebaseUser, role);
          // Pass the ID directly to avoid stale state issues on login
          refreshOrders(firebaseUser.uid);
        };

        fetchUserRole();
        fetchCart(firebaseUser.uid);
        fetchMessages(firebaseUser.uid);

        // Subscribe to real-time messages and orders
        if (supabase) {
          messageSubscription = supabase
            .channel('app-sync')
            .on(
              'postgres_changes', 
              { event: 'INSERT', schema: 'public', table: 'messages' }, 
              (payload) => {
                const newMessage = payload.new;
                if (newMessage.sender_id === firebaseUser.uid || newMessage.receiver_id === firebaseUser.uid) {
                  setMessages(prev => {
                    // Avoid duplicates
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    
                    const msg: Message = {
                      id: newMessage.id,
                      senderId: newMessage.sender_id,
                      receiverId: newMessage.receiver_id,
                      content: newMessage.content,
                      productId: newMessage.product_id,
                      createdAt: newMessage.created_at,
                      isRead: newMessage.is_read
                    };
                    return [...prev, msg];
                  });
                }
              }
            )
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'messages' },
              (payload) => {
                const updatedMessage = payload.new;
                setMessages(prev => prev.map(m => m.id === updatedMessage.id ? {
                  ...m,
                  isRead: updatedMessage.is_read
                } : m));
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'orders' },
              () => {
                refreshOrders(firebaseUser.uid);
              }
            )
            .subscribe();
        }
      } else {
        setCurrentUser(null);
        setCart([]);
        setMessages([]);
        setOrders([]);
        if (messageSubscription) {
          supabase?.removeChannel(messageSubscription);
        }
      }
    });

    return () => {
      unsubscribe();
      if (messageSubscription) {
        supabase?.removeChannel(messageSubscription);
      }
    };
  }, []);

  // Refresh orders whenever currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      refreshOrders(currentUser.id);
    }
  }, [currentUser?.id]);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLoginModalOpen(false);
      setCurrentPage('home');
      setSelectedProductId(null);
    } catch (error: any) {
      console.error('Login failed:', error);
      let message = 'An unknown error occurred during sign in.';
      if (error?.code === 'auth/cancelled-popup-request') {
        message = 'The sign-in popup was cancelled or blocked. Since this app runs inside a preview iframe, try clicking only once, enabling popups, or opening the app in a new tab.';
      } else if (error?.code === 'auth/popup-closed-by-user') {
        message = 'The sign-in popup was closed before completion. Please try again.';
      } else if (error?.code === 'auth/popup-blocked') {
        message = 'The sign-in popup was blocked by your browser. Please allow popups for this site or open the app in a new tab.';
      } else if (error?.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this host';
        message = `Firebase Auth cannot sign in from ${host}. Add this domain to your Firebase project's authorized domains and restart the app.`;
      } else if (error?.message) {
        message = error.message;
      }
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      setCurrentPage('home');
      setSelectedProductId(null);
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const addToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && currentUser && product.vendorId === currentUser.id) {
      console.warn("Owner cannot add their own product to cart");
      return;
    }

    if (currentUser && supabase) {
      const existingItem = cart.find(item => item.productId === productId);
      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('user_id', currentUser.id)
          .eq('product_id', productId);
        if (error) console.error('Error updating cart:', error);
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: currentUser.id,
            product_id: productId,
            quantity: 1
          });
        if (error) console.error('Error adding to cart:', error);
      }
      fetchCart(currentUser.id);
    } else {
      setCart(prev => {
        const existing = prev.find(item => item.productId === productId);
        if (existing) {
          return prev.map(item => 
            item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
          );
        }
        return [...prev, { productId, quantity: 1 }];
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (currentUser && supabase) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('product_id', productId);
      if (error) console.error('Error removing from cart:', error);
      fetchCart(currentUser.id);
    } else {
      setCart(prev => prev.filter(item => item.productId !== productId));
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    if (currentUser && supabase) {
      const item = cart.find(i => i.productId === productId);
      if (!item) return;
      const newQty = Math.max(0, item.quantity + delta);
      
      if (newQty === 0) {
        await removeFromCart(productId);
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('user_id', currentUser.id)
          .eq('product_id', productId);
        if (error) console.error('Error updating quantity:', error);
        fetchCart(currentUser.id);
      }
    } else {
      setCart(prev => prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0));
    }
  };

  const clearCart = async () => {
    if (currentUser && supabase) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', currentUser.id);
      if (error) console.error('Error clearing cart:', error);
      setCart([]);
    } else {
      setCart([]);
    }
  };

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      login,
      logout,
      isLoggingIn,
      loginError,
      setLoginError,
      products,
      isLoadingProducts,
      profiles,
      refreshProducts,
      refreshProfiles,
      ratings,
      addRating,
      refreshRatings,
      messages,
      sendChatMessage,
      markMessagesAsRead,
      orders,
      createOrder,
      updateOrderStatus,
      refreshOrders,
      checkout,
      updateProfile,
      changeUserRole,
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart,
      cartTotal,
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery,
      selectedProductId,
      setSelectedProductId,
      currentPage,
      setCurrentPage,
      isCartOpen,
      setIsCartOpen,
      isLoginModalOpen,
      setIsLoginModalOpen,
      isChatOpen,
      setIsChatOpen,
      activeChatReceiverId,
      setActiveChatReceiverId,
      filterByVendorId,
      setFilterByVendorId
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
