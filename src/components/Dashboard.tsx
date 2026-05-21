/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  User,
  Settings, 
  ShoppingBag, 
  Plus, 
  Menu,
  CheckCircle,
  Clock,
  TrendingUp,
  Store,
  Bike,
  MapPin,
  ClipboardCheck,
  CheckCheck,
  DollarSign,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import SellerEditor from './SellerEditor';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  role: 'vendor' | 'admin' | 'rider' | 'customer';
  initialTab?: 'overview' | 'orders' | 'inventory' | 'earnings' | 'settings';
}

export default function Dashboard({ role, initialTab }: DashboardProps) {
  const { 
    orders, 
    products, 
    profiles, 
    currentUser, 
    updateOrderStatus, 
    refreshOrders,
    updateProfile,
    changeUserRole,
    setSelectedProductId,
    setIsChatOpen,
    setActiveChatReceiverId,
    refreshProfiles
  } = useApp();

  const getInitialTab = () => {
    if (role === 'admin') {
      if (initialTab === 'settings') return 'settings';
      return 'sales';
    }
    return initialTab || 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [ordersView, setOrdersView] = useState<'purchases' | 'sales' | 'rider_hub'>(role === 'rider' ? 'rider_hub' : 'purchases');
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'to_receive' | 'completed' | 'cancelled' | 'return'>('all');
  const [riderFilter, setRiderFilter] = useState<'all' | 'ready' | 'completed'>('all');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Admin-specific states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminOrderSearch, setAdminOrderSearch] = useState('');
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'ready' | 'completed'>('all');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | 'customer' | 'vendor' | 'rider' | 'admin'>('all');
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Filter orders based on role
  const myOrders = orders.filter(o => {
    if (role === 'rider') {
      // Show order if it is assigned to this rider, or if it is ready for pickup and unclaimed by anyone else
      return o.riderId === currentUser?.id || (o.status === 'ready_for_pickup' && (!o.riderId || o.riderId === currentUser?.id));
    }
    
    // Customer role handles both buying and selling
    if (role === 'customer' || role === 'vendor') {
      return o.buyerId === currentUser?.id || o.sellerId === currentUser?.id;
    }
    
    return true; // Admin sees all
  });

  const pendingOrdersCount = myOrders.filter(o => o.status === 'pending' || o.status === 'ready_for_pickup' || o.status === 'confirmed').length;

  const totalEarnings = myOrders
    .filter(o => o.status === 'payment_received')
    .reduce((sum, o) => {
      if (o.sellerId === currentUser?.id) {
        const productSubtotal = o.items && o.items.length > 0
          ? o.items.reduce((acc: number, item: any) => acc + (item.productPrice * item.quantity), 0)
          : Math.max(0, o.totalAmount - 50);
        return sum + (productSubtotal * 0.9); // 90% profile earnings for seller on products
      }
      if (o.riderId === currentUser?.id) return sum + 45; // Fixed fee for rider
      return sum;
    }, 0);

  const stats = role === 'rider' ? [
    { label: 'Deliveries', value: myOrders.filter(o => o.status === 'completed' || o.status === 'payment_received').length, icon: ClipboardCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Ready', value: myOrders.filter(o => o.status === 'ready_for_pickup').length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Earning', value: `₱${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Rating', value: '4.9', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50' },
  ] : (role === 'customer' || role === 'vendor') ? [
    { label: 'Purchases', value: myOrders.filter(o => o.buyerId === currentUser?.id).length, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Sales', value: `₱${totalEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Inventory', value: products.filter(p => p.vendorId === currentUser?.id).length, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Pending', value: pendingOrdersCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  ] : [
    { label: 'Revenue', value: `₱${totalEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Vendors', value: profiles.filter(p => p.role === 'vendor').length, icon: Store, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Riders', value: profiles.filter(p => p.role === 'rider').length, icon: Bike, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Users', value: profiles.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="flex bg-transparent min-h-[calc(100vh-100px)] p-4 sm:p-6 lg:p-8 relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-emerald-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Wrapper */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-xl z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0 lg:bg-transparent lg:w-64 lg:mr-8 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col overflow-hidden lg:glass lg:rounded-[3rem]
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                {role === 'rider' ? <Bike size={24} /> : role === 'vendor' ? <Store size={24} /> : role === 'customer' ? <ShoppingBag size={24} /> : <Settings size={24} />}
              </div>
              <div>
                <p className="font-black text-emerald-900 leading-tight capitalize border-b-2 border-emerald-500 pb-0.5">
                  {role === 'admin' ? 'Admin CMS' : `${role} Hub`}
                </p>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">PalawanMart</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {role === 'admin' ? (
              <>
                <SidebarItem 
                  icon={TrendingUp} 
                  label="Sales" 
                  active={activeTab === 'sales'} 
                  onClick={() => { setActiveTab('sales'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={ShoppingBag} 
                  label="Orders" 
                  active={activeTab === 'admin_orders'} 
                  onClick={() => { setActiveTab('admin_orders'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={Users} 
                  label="Accounts" 
                  active={activeTab === 'accounts'} 
                  onClick={() => { setActiveTab('accounts'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={User} 
                  label="Profile" 
                  active={activeTab === 'settings'} 
                  onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
                />
              </>
            ) : (
              <>
                <SidebarItem 
                  icon={BarChart3} 
                  label="Overview" 
                  active={activeTab === 'overview'} 
                  onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} 
                />
                <SidebarItem 
                  icon={ShoppingBag} 
                  label="Orders" 
                  active={activeTab === 'orders'} 
                  onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }} 
                  badge={pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined} 
                />
                {(role === 'vendor' || role === 'customer') && (
                  <SidebarItem 
                    icon={Package} 
                    label="Inventory" 
                    active={activeTab === 'inventory'} 
                    onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }} 
                  />
                )}
                {(role === 'vendor' || role === 'customer' || role === 'rider') && (
                  <SidebarItem 
                    icon={DollarSign} 
                    label="Earnings" 
                    active={activeTab === 'earnings'} 
                    onClick={() => { setActiveTab('earnings'); setIsSidebarOpen(false); }} 
                  />
                )}
                <SidebarItem 
                  icon={User} 
                  label="Profile" 
                  active={activeTab === 'settings'} 
                  onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
                />
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-emerald-900/5 backdrop-blur-md rounded-[2rem] p-5 border border-white/40">
            <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">Support Center</p>
            <p className="text-[10px] text-emerald-600 font-medium leading-relaxed">
              Need help? Contact our team 24/7.
            </p>
            <button 
              onClick={() => {
                const supportUser = profiles.find(p => p.email === 'palawanmartofficial@gmail.com');
                if (supportUser) {
                  setActiveChatReceiverId(supportUser.id);
                  setIsChatOpen(true);
                  setIsSidebarOpen(false);
                } else {
                  alert('Support team is currently offline.');
                }
              }}
              className="mt-3 w-full bg-white/50 hover:bg-white text-[10px] font-black py-2 rounded-xl transition-all"
            >
              Live Chat
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/40 active:scale-95 transition-all border-2 border-white/20"
            >
              <Menu size={20} strokeWidth={3} />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-wider">Dashboard</span>
                <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">Open Menu</span>
              </div>
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-emerald-900 tracking-tight">
                Hello, {currentUser?.name.split(' ')[0]}!
              </h1>
              <p className="text-xs sm:text-base text-emerald-600/60 font-medium leading-relaxed">
                {role === 'customer' || role === 'vendor'
                  ? 'Manage your store or shop local.' 
                  : role === 'admin'
                  ? 'System Corporate Admin CMS Console.'
                  : `Efficiently manage your ${role} tasks.`}
              </p>
            </div>
          </div>
          {(role === 'vendor' || role === 'customer') && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:shadow-xl hover:shadow-primary/30 transition-all transform hover:scale-105"
            >
              <Plus size={20} strokeWidth={3} />
              Add Listing
            </button>
          )}
        </div>

        {/* Overview Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key="overview"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (stat &&
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-6 rounded-[2.5rem]"
                  >
                    <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                      <stat.icon size={28} />
                    </div>
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-emerald-900 mt-1 tracking-tight">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent Orders Pool */}
              <div className="glass-card rounded-[3rem] overflow-hidden">
                <div className="p-8 flex items-center justify-between">
                  <h2 className="font-black text-lg sm:text-xl text-emerald-900">
                    {role === 'rider' ? 'Pickup Opportunities' : role === 'customer' ? 'My Purchases' : 'Recent Orders'}
                  </h2>
                </div>
                <div className="w-full">
                  <table className="w-full text-sm text-left block md:table">
                    <thead className="bg-emerald-50/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest hidden md:table-header-group">
                      <tr>
                        <th className="px-8 py-5">Order Items</th>
                        <th className="px-8 py-5">Total</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 block md:table-row-group">
                      {myOrders.slice(0, 10).map(order => (
                        <OrderTableRow 
                          key={order.id} 
                          order={order} 
                          role={role} 
                          products={products} 
                          profiles={profiles}
                          updateOrderStatus={updateOrderStatus}
                          currentUser={currentUser}
                        />
                      ))}
                      {myOrders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-10 text-center text-emerald-900/40 font-black italic">
                            No recent activity.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
             <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key="orders"
                className="space-y-6"
             >
                {/* Orders Main Tabs */}
                <div className="flex flex-wrap gap-4 p-1 bg-emerald-50 w-fit rounded-2xl border border-emerald-100">
                  {role === 'rider' && (
                    <button 
                      onClick={() => setOrdersView('rider_hub')}
                      className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${ordersView === 'rider_hub' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-emerald-900/40 hover:text-indigo-600'}`}
                    >
                      Rider Hub
                    </button>
                  )}
                  <button 
                    onClick={() => setOrdersView('purchases')}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${ordersView === 'purchases' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-emerald-900/40 hover:text-primary'}`}
                  >
                    Purchases
                  </button>
                  <button 
                    onClick={() => setOrdersView('sales')}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${ordersView === 'sales' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-emerald-900/40 hover:text-primary'}`}
                  >
                    Sales
                  </button>
                </div>

                <div className="glass-card rounded-[3rem] overflow-hidden">
                  <div className="p-4 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-100/50">
                    <h2 className="font-black text-lg sm:text-xl text-emerald-900">
                      {ordersView === 'rider_hub' ? 'Available for Pickup' : ordersView === 'purchases' ? 'My Purchase History' : 'My Sales History'}
                    </h2>
                    
                    {ordersView === 'rider_hub' && (
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'All Tasks' },
                          { id: 'ready', label: 'Ready for Pickup' },
                          { id: 'completed', label: 'Completed Deliveries' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setRiderFilter(f.id as any)}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border ${
                              riderFilter === f.id 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                : 'bg-white text-emerald-900/40 border-emerald-100 hover:border-indigo-600'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {ordersView === 'purchases' && (
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'to_receive', label: 'To Receive' },
                          { id: 'completed', label: 'Completed' },
                          { id: 'cancelled', label: 'Cancelled' },
                          { id: 'return', label: 'Return' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setPurchaseFilter(f.id as any)}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border ${
                              purchaseFilter === f.id 
                                ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' 
                                : 'bg-white text-emerald-900/40 border-emerald-100 hover:border-primary'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <table className="w-full text-sm text-left block md:table">
                      <thead className="bg-emerald-50/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest hidden md:table-header-group">
                        <tr>
                          <th className="px-8 py-5">Order & Items</th>
                          <th className="px-8 py-5">Total</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20 block md:table-row-group">
                        {myOrders
                          .filter(order => {
                            if (ordersView === 'rider_hub') {
                              const isUnclaimed = order.status === 'ready_for_pickup' && (!order.riderId || order.riderId === currentUser?.id);
                              const isMyTask = order.riderId === currentUser?.id;
                              
                              if (!isUnclaimed && !isMyTask) return false;
                              
                              if (riderFilter === 'ready') {
                                return order.status === 'ready_for_pickup' || order.status === 'picked_up';
                              }
                              if (riderFilter === 'completed') {
                                return order.status === 'delivered' || order.status === 'payment_received';
                              }
                              return true;
                            }
                            if (ordersView === 'purchases') {
                              if (order.buyerId !== currentUser?.id) return false;
                              if (purchaseFilter === 'to_receive') return ['pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'delivered'].includes(order.status);
                              if (purchaseFilter === 'completed') return order.status === 'payment_received';
                              if (purchaseFilter === 'cancelled') return order.status === 'cancelled';
                              if (purchaseFilter === 'return') return order.status === 'return';
                              return true;
                            } else {
                              return order.sellerId === currentUser?.id;
                            }
                          })
                          .map(order => (
                            <OrderTableRow 
                              key={order.id} 
                              order={order} 
                              role={role} 
                              products={products} 
                              profiles={profiles}
                              updateOrderStatus={updateOrderStatus}
                              currentUser={currentUser}
                            />
                          ))}
                        {myOrders.filter(order => ordersView === 'purchases' ? order.buyerId === currentUser?.id : order.sellerId === currentUser?.id).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-200">
                                  <ShoppingBag size={32} />
                                </div>
                                <div className="max-w-xs mx-auto">
                                  <p className="text-emerald-900 font-black mb-1 italic">No orders found.</p>
                                  <p className="text-xs text-emerald-600/60 font-medium">
                                    {ordersView === 'purchases'
                                      ? "You haven't placed any orders matching this criteria." 
                                      : "You haven't received any orders for your products yet."}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'earnings' && role !== 'customer' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              key="earnings"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-8 rounded-[3rem] bg-gradient-to-br from-emerald-900 to-emerald-800 text-white">
                  <h3 className="text-emerald-500 font-black uppercase tracking-widest text-xs mb-2">Net Earnings</h3>
                  <p className="text-5xl font-black mb-6">₱{totalEarnings.toLocaleString()}</p>
                  <div className="h-1 w-full bg-white/20 rounded-full mb-6">
                    <div className="h-full bg-primary w-[70%]" />
                  </div>
                  <p className="text-sm text-emerald-100/60 font-medium italic">Target: ₱20,000 this month</p>
                </div>

                <div className="glass-card p-8 rounded-[3rem]">
                   <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-6">Commission Structure</h3>
                   <div className="space-y-4">
                     <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                       <span className="font-bold text-emerald-900">Platform Fee (Products)</span>
                       <span className="font-black text-primary">10%</span>
                     </div>
                     <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                       <span className="font-bold text-emerald-900">Platform Fee (Shipping)</span>
                       <span className="font-black text-primary">10%</span>
                     </div>
                     <p className="text-[10px] text-emerald-900/40 font-bold text-center uppercase tracking-widest mt-4">
                       Commissions support PalawanMart operations and rider insurance.
                     </p>
                   </div>
                </div>
              </div>

              <div className="glass-card rounded-[3rem] overflow-hidden mt-8">
                 <div className="p-8">
                   <h2 className="font-black text-xl text-emerald-900">Recent Completed Payouts</h2>
                 </div>
                 <div className="w-full">
                    <table className="w-full text-sm text-left block md:table">
                      <thead className="bg-emerald-50/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest hidden md:table-header-group">
                        <tr>
                          <th className="px-8 py-5">Order ID</th>
                          <th className="px-8 py-5">Product Amount</th>
                          <th className="px-8 py-5">Shipping Amount</th>
                          <th className="px-8 py-5">Platform Fee</th>
                          <th className="px-8 py-5 text-right">Your Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20 block md:table-row-group">
                        {myOrders.filter(o => o.status === 'payment_received').map(order => {
                          const isSellerNode = order.sellerId === currentUser?.id;
                          const productSubtotal = order.items && order.items.length > 0
                            ? order.items.reduce((sum: number, item: any) => sum + (item.productPrice * item.quantity), 0)
                            : Math.max(0, order.totalAmount - 50);
                          const yourNet = isSellerNode ? (productSubtotal * 0.9) : 45;
                          const fee = isSellerNode ? (productSubtotal * 0.1) : 5;
                          return (
                            <tr key={order.id} className="hover:bg-white/40 transition-all block md:table-row p-6 md:p-0 space-y-2 md:space-y-0">
                              <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Order ID</span>
                                <span className="font-mono text-[10px] text-emerald-300">#{order.id.slice(0, 8)}</span>
                              </td>
                              <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
                                <div className="flex justify-between md:block">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden">Product</span>
                                  <span className="font-bold text-emerald-900">₱{productSubtotal.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
                                <div className="flex justify-between md:block">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden">Shipping</span>
                                  <span className="font-bold text-emerald-900">₱50</span>
                                </div>
                              </td>
                              <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
                                <div className="flex justify-between md:block">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden">Platform Fee</span>
                                  <span className="font-bold text-red-500">-₱{fee.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell text-right border-t border-emerald-100/50 md:border-0 pt-2 md:pt-5">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block text-left mb-1">Your Net</span>
                                <span className="font-black text-primary text-2xl md:text-xl">₱{yourNet.toLocaleString()}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {myOrders.filter(o => o.status === 'payment_received').length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-8 py-10 text-center text-emerald-900/40 font-bold italic">
                              No completed earnings yet. Keep delivering!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>
            </motion.div>
          )}

          {/* Admin Sales Tab */}
          {activeTab === 'sales' && role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key="admin_sales"
              className="space-y-8"
            >
              {/* Date Filters Card */}
              <div className="glass-card p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Filter size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-900 leading-tight">Filter Sales by Date</h3>
                    <p className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider">Filtered by updated_at date</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-emerald-800/60 font-black uppercase tracking-wider">Start</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-emerald-800/60 font-black uppercase tracking-wider">End</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-bold text-emerald-955 focus:outline-none"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="px-4 py-2 bg-red-50 text-red-500 font-black text-xs uppercase rounded-xl hover:bg-red-100 transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* KPI metrics */}
              {(() => {
                const completedOrders = orders.filter(o => {
                  if (o.status !== 'payment_received') return false;
                  const updateDate = new Date(o.updatedAt);
                  if (startDate) {
                    const startObj = new Date(startDate);
                    if (updateDate < startObj) return false;
                  }
                  if (endDate) {
                    const endObj = new Date(endDate);
                    endObj.setHours(23, 59, 59, 999);
                    if (updateDate > endObj) return false;
                  }
                  return true;
                });

                const totalCompletedSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                const salesCount = completedOrders.length;
                const averageSale = salesCount > 0 ? (totalCompletedSales / salesCount) : 0;

                // Group by Month/Year
                const monthlyMap: { [key: string]: number } = {};
                completedOrders.forEach(o => {
                  const d = new Date(o.updatedAt);
                  const year = d.getFullYear();
                  const monthName = d.toLocaleString('en-US', { month: 'long' });
                  const key = `${monthName} ${year}`;
                  monthlyMap[key] = (monthlyMap[key] || 0) + o.totalAmount;
                });

                const monthlySales = Object.entries(monthlyMap).map(([month, sum]) => ({
                  month,
                  sum
                }));

                const maxMonthlySale = monthlySales.length > 0 ? Math.max(...monthlySales.map(m => m.sum)) : 1;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-950 to-emerald-800 text-white shadow-xl shadow-emerald-900/10 border-0">
                        <p className="text-[10px] font-black uppercase text-emerald-300 tracking-widest mb-1">Total Completed Revenue</p>
                        <p className="text-4xl font-black">₱{totalCompletedSales.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-200/50 mt-2 font-bold">Only payment_received status computed</p>
                      </div>

                      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Completed Transactions</p>
                        <p className="text-4xl font-black text-emerald-900">{salesCount.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-600/60 mt-2 font-bold">Orders that has completed delivery chain</p>
                      </div>

                      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Average Order Value</p>
                        <p className="text-4xl font-black text-emerald-900">₱{Math.round(averageSale).toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-600/60 mt-2 font-bold">Average basket size of completed orders</p>
                      </div>
                    </div>

                    {/* Sales per Month Breakdown */}
                    <div className="glass-card rounded-[3rem] p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="font-black text-xl text-emerald-900">Sales Per Month</h2>
                          <p className="text-xs text-emerald-600/60 font-bold">Aggregated transaction volumes by month</p>
                        </div>
                      </div>

                      {monthlySales.length === 0 ? (
                        <div className="py-20 text-center text-emerald-900/40 font-black italic">
                          No completed monthly sales detected within the selected scope.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Visual custom bar list */}
                          <div className="space-y-6">
                            {monthlySales.map(({ month, sum }) => {
                              const percentage = Math.max(8, Math.round((sum / maxMonthlySale) * 100));
                              return (
                                <div key={month} className="space-y-2">
                                  <div className="flex justify-between items-center text-xs font-black">
                                    <span className="text-emerald-900">{month}</span>
                                    <span className="text-primary">₱{sum.toLocaleString()}</span>
                                  </div>
                                  <div className="h-4 w-full bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      className="h-full bg-emerald-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Chronological Table List */}
                          <div className="bg-emerald-50/30 rounded-2xl p-4 sm:p-6 border border-emerald-100/50">
                            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-4 pb-2 border-b border-emerald-100">Billing Log Summary</h4>
                            <div className="space-y-4">
                              {monthlySales.map(({ month, sum }) => (
                                <div key={month} className="flex justify-between items-center py-2 border-b border-emerald-900/5 text-sm font-bold text-emerald-900/80">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    {month}
                                  </span>
                                  <span>₱{sum.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* Admin Orders CMS Tab */}
          {activeTab === 'admin_orders' && role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key="admin_orders"
              className="space-y-6"
            >
              {/* Search and Filters Hub */}
              <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                <div>
                  <h2 className="font-black text-xl text-emerald-900">Orders Master Catalog</h2>
                  <p className="text-xs text-emerald-600/60 font-bold">Search, track, and inspect all orders processed in PalawanMart</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Search bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 w-5 h-5" />
                    <input 
                      type="text"
                      value={adminOrderSearch}
                      onChange={(e) => setAdminOrderSearch(e.target.value)}
                      placeholder="Search Order ID UUID..."
                      className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  {/* Top Filters: All Task, Ready for Pickup, Completed */}
                  <div className="flex flex-wrap gap-2 h-fit">
                    {[
                      { id: 'all', label: 'All Task' },
                      { id: 'ready', label: 'Ready For PICK UP' },
                      { id: 'completed', label: 'Completed' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAdminOrderFilter(f.id as any)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                          adminOrderFilter === f.id 
                            ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' 
                            : 'bg-white text-emerald-900/40 border-emerald-100 hover:border-emerald-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Orders Table list */}
              {(() => {
                const filteredAdminOrders = orders.filter(o => {
                  // Search string match on UUID
                  if (adminOrderSearch.trim()) {
                    if (!o.id.toLowerCase().includes(adminOrderSearch.toLowerCase().trim())) {
                      return false;
                    }
                  }

                  // Filter status match
                  if (adminOrderFilter === 'ready') {
                    return o.status === 'ready_for_pickup';
                  }
                  if (adminOrderFilter === 'completed') {
                    return o.status === 'delivered' || o.status === 'payment_received';
                  }
                  return true;
                });

                return (
                  <div className="glass-card rounded-[3rem] overflow-hidden">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-sm text-left block md:table">
                        <thead className="bg-emerald-50/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest hidden md:table-header-group">
                          <tr>
                            <th className="px-8 py-5">Order ID / Date</th>
                            <th className="px-8 py-5">Parties</th>
                            <th className="px-8 py-5">Items</th>
                            <th className="px-8 py-5">Subtotal</th>
                            <th className="px-8 py-5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20 block md:table-row-group">
                          {filteredAdminOrders.map(order => {
                            const buyer = profiles.find(p => p.id === order.buyerId);
                            const seller = profiles.find(p => p.id === order.sellerId);
                            const rider = order.riderId ? profiles.find(p => p.id === order.riderId) : null;
                            const buyerName = buyer?.display_name2 || buyer?.display_name || buyer?.email || 'N/A';
                            const sellerName = seller?.display_name2 || seller?.display_name || 'N/A';
                            const riderName = rider ? (rider?.display_name2 || rider?.display_name || 'Rider') : 'None';

                            return (
                              <tr key={order.id} className="hover:bg-white/40 transition-all block md:table-row p-6 md:p-0 space-y-4 md:space-y-0">
                                <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Order Details</span>
                                  <div className="font-mono text-xs text-emerald-950 font-black">
                                    UUID: <span className="text-emerald-600 font-medium select-all">{order.id}</span>
                                  </div>
                                  <div className="text-[10px] text-emerald-600/60 font-bold mt-1">
                                    Ordered: {new Date(order.createdAt).toLocaleString()}
                                  </div>
                                  <div className="text-[10px] text-indigo-600/60 font-bold">
                                    Updated: {new Date(order.updatedAt).toLocaleString()}
                                  </div>
                                </td>

                                <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Parties</span>
                                  <div className="space-y-0.5 text-xs text-emerald-905">
                                    <div>👨‍💼 <span className="font-black text-emerald-900">Buyer:</span> {buyerName}</div>
                                    <div>🏪 <span className="font-black text-emerald-900">Seller:</span> {sellerName}</div>
                                    <div>🛵 <span className="font-black text-emerald-900">Rider:</span> {riderName}</div>
                                  </div>
                                </td>

                                <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Items</span>
                                  <div className="text-xs text-emerald-955 font-bold space-y-1">
                                    {order.items?.map(it => (
                                      <div key={it.id}>
                                        🛒 {it.productName} <span className="text-emerald-500 font-black">x{it.quantity}</span>
                                      </div>
                                    ))}
                                    {(!order.items || order.items.length === 0) && (
                                      <span className="text-emerald-900/40 italic">No item list details</span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Grand Total</span>
                                  <div className="text-base font-black text-emerald-950">
                                    ₱{order.totalAmount.toLocaleString()}
                                  </div>
                                  <div className="text-[9px] text-emerald-600 uppercase tracking-wider font-extrabold mt-0.5">
                                    {order.paymentMethod}
                                  </div>
                                </td>

                                <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Status</span>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    order.status === 'payment_received' 
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : order.status === 'delivered'
                                      ? 'bg-blue-100 text-blue-700'
                                      : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700'
                                      : order.status === 'ready_for_pickup'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    {order.status.replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          
                          {filteredAdminOrders.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center text-emerald-900/40 font-black italic">
                                No orders matching search/filters found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Admin Accounts CMS Tab */}
          {activeTab === 'accounts' && role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 25 }}
              key="admin_accounts"
              className="space-y-6"
            >
              <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] space-y-6">
                <div>
                  <h2 className="font-black text-xl text-emerald-900">User Accounts & Roles</h2>
                  <p className="text-xs text-emerald-600/60 font-bold">Configure client profiles, vendor stores, admin keys, and delivery fleet classifications</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Search bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 w-5 h-5" />
                    <input 
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Search accounts catalog..."
                      className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-emerald-950 placeholder:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  {/* Role selection filters */}
                  <div className="relative">
                    <select
                      value={accountRoleFilter}
                      onChange={(e) => setAccountRoleFilter(e.target.value as any)}
                      className="bg-emerald-50 border border-emerald-100 rounded-2xl py-3 px-6 text-xs sm:text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="all">🌐 All Roles</option>
                      <option value="customer">👨‍💼 Customer</option>
                      <option value="vendor">🏪 Vendor Store</option>
                      <option value="rider">🛵 Delivery Rider</option>
                      <option value="admin">🔑 Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Profiles layout */}
              {(() => {
                const filteredProfiles = profiles.filter(p => {
                  // Search string filter on email or display name
                  if (accountSearch.trim()) {
                    const searchStr = accountSearch.toLowerCase().trim();
                    const nameMatch = (p.display_name || '').toLowerCase().includes(searchStr) || (p.display_name2 || '').toLowerCase().includes(searchStr) || (p.name || '').toLowerCase().includes(searchStr);
                    const emailMatch = (p.email || '').toLowerCase().includes(searchStr);
                    if (!nameMatch && !emailMatch) return false;
                  }

                  // Class filter
                  if (accountRoleFilter !== 'all') {
                    if (p.role !== accountRoleFilter) return false;
                  }

                  return true;
                });

                const handleUpdateUserRole = async (userId: string, targetRole: 'customer' | 'vendor' | 'rider' | 'admin') => {
                  setIsUpdatingRole(userId);
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ role: targetRole })
                      .eq('id', userId);

                    if (error) throw error;

                    await refreshProfiles();
                    alert('Profile role updated successfully!');
                  } catch (err: any) {
                    console.error('Error changing profile role:', err);
                    alert('Failed to change role: ' + (err.message || err));
                  } finally {
                    setIsUpdatingRole(null);
                  }
                };

                return (
                  <div className="glass-card rounded-[3rem] overflow-hidden">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-sm text-left block md:table">
                        <thead className="bg-emerald-50/50 text-emerald-400 font-black uppercase text-[10px] tracking-widest hidden md:table-header-group">
                          <tr>
                            <th className="px-8 py-5">User ID</th>
                            <th className="px-8 py-5">Display Names</th>
                            <th className="px-8 py-5">Account Email</th>
                            <th className="px-8 py-5">Current Role</th>
                            <th className="px-8 py-5">Update Account Classification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20 block md:table-row-group">
                          {filteredProfiles.map(p => (
                            <tr key={p.id} className="hover:bg-white/40 transition-all block md:table-row p-6 md:p-0 space-y-3 md:space-y-0">
                              <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">User ID</span>
                                <span className="font-mono text-xs text-emerald-300 font-bold select-all">{p.id}</span>
                              </td>

                              <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Names</span>
                                <div className="text-sm font-black text-emerald-900 leading-tight">
                                  {p.display_name2 || p.display_name || p.name || 'Anonymous User'}
                                </div>
                                {(p.display_name2 || p.display_name) && p.name && (
                                  <div className="text-[10px] text-emerald-600/60 font-bold mt-0.5">
                                    Full Name: {p.name}
                                  </div>
                                )}
                              </td>

                              <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Email address</span>
                                <div className="text-xs text-emerald-800 font-bold">
                                  {p.email}
                                </div>
                              </td>

                              <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Role</span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  p.role === 'admin' 
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : p.role === 'rider'
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    : p.role === 'vendor'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  🔑 {p.role}
                                </span>
                              </td>

                              <td className="px-0 md:px-8 py-0 md:py-6 block md:table-cell">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest md:hidden block mb-1">Classification Editor</span>
                                <div className="flex items-center gap-2">
                                  <select
                                    disabled={isUpdatingRole === p.id}
                                    value={p.role}
                                    onChange={(e) => handleUpdateUserRole(p.id, e.target.value as any)}
                                    className="bg-emerald-50 border border-emerald-100 rounded-xl py-1.5 px-3 text-xs font-bold text-emerald-950 focus:outline-none disabled:opacity-50 cursor-pointer"
                                  >
                                    <option value="customer">👨‍💼 Customer</option>
                                    <option value="vendor">🏪 Vendor</option>
                                    <option value="rider">🛵 Rider</option>
                                    <option value="admin">🔑 Admin</option>
                                  </select>
                                  {isUpdatingRole === p.id && (
                                    <Loader2 className="animate-spin text-emerald-600" size={14} />
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          
                          {filteredProfiles.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-8 py-10 text-center text-emerald-900/40 font-bold italic">
                                No profiles matching query found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'inventory' && (
             <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key="inventory"
                className="glass-card rounded-[3rem] p-8"
             >
                <SellerEditor onBack={() => setActiveTab('overview')} />
             </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="settings"
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="glass-card rounded-[3rem] p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-emerald-900">User Profile</h2>
                    <p className="text-sm text-emerald-600/60 font-medium tracking-tight">Update your personal information used for your orders.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Display Name</label>
                       <input 
                         type="text"
                         placeholder="Your full name"
                         defaultValue={currentUser?.name || ''}
                         id="display_name_input"
                         className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl py-4 px-6 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Contact Number</label>
                       <input 
                         type="tel"
                         placeholder="09XX XXX XXXX"
                         defaultValue={currentUser?.contact_number || ''}
                         id="contact_number_input"
                         className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl py-4 px-6 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Delivery Address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300 group-focus-within:text-emerald-600 transition-colors">
                        <MapPin size={18} />
                      </div>
                      <textarea 
                        defaultValue={currentUser?.delivery_address}
                        id="delivery_address_input"
                        className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none"
                        placeholder="Enter your complete delivery address..."
                      />
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      const name = (document.getElementById('display_name_input') as HTMLInputElement).value;
                      const contact = (document.getElementById('contact_number_input') as HTMLInputElement).value;
                      const addr = (document.getElementById('delivery_address_input') as HTMLTextAreaElement).value;
                      
                      if (!name.trim()) {
                        alert('Display name is required');
                        return;
                      }

                      setIsSavingProfile(true);
                      try {
                        await updateProfile({ 
                          name: name.trim(), 
                          contact_number: contact.trim(),
                          delivery_address: addr 
                        });
                        alert('Profile updated successfully!');
                      } catch (err) {
                        console.error('Failed to update profile:', err);
                        alert('Failed to update profile. Please try again.');
                      } finally {
                        setIsSavingProfile(false);
                      }
                    }}
                    disabled={isSavingProfile}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Profile Changes'
                    )}
                  </button>

                  <div className="pt-4">
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-8 py-8 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900">PalawanMart Privacy Secure</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900">v1.2.0-STABLE</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, badge, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] cursor-pointer transition-all ${
      active ? 'bg-primary text-white shadow-xl shadow-primary/30 font-black' : 'text-emerald-800/50 hover:bg-white/60 hover:text-primary font-bold'
    }`}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className="text-sm flex-1">{label}</span>
      {badge && (
        <span className="bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

const OrderTableRow = ({ order, role, products, profiles, updateOrderStatus, currentUser }: any) => {
  const { setSelectedProductId, setCurrentPage } = useApp();
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const riderId = currentUser?.id;
  const firstItem = order.items?.[0];
  const othersCount = (order.items?.length || 0) - 1;
  const buyer = profiles.find((p: any) => p.id === order.buyerId);
  const seller = profiles.find((p: any) => p.id === order.sellerId);
  
  const handleAction = async () => {
    try {
      const isSeller = order.sellerId === currentUser?.id;
      const isBuyer = order.buyerId === currentUser?.id;
      const isRider = role === 'rider' || currentUser?.role === 'rider';

      if (isSeller) {
        setIsUpdating(true);
        if (order.status === 'pending') await updateOrderStatus(order.id, 'confirmed');
        else if (order.status === 'confirmed') await updateOrderStatus(order.id, 'ready_for_pickup');
      } else if (isRider) {
        if (order.status === 'ready_for_pickup') {
          setIsUpdating(true);
          await updateOrderStatus(order.id, 'picked_up', currentUser?.id);
        } else if (order.status === 'picked_up') {
          // Trigger file selection for photo proof
          fileInputRef.current?.click();
        } else if (order.status === 'delivered') {
          setIsUpdating(true);
          await updateOrderStatus(order.id, 'payment_received');
        }
      } else if (isBuyer) {
        setIsUpdating(true);
        if (order.status === 'delivered') await updateOrderStatus(order.id, 'payment_received');
      }
    } catch (error: any) {
      console.error('Action failed:', error);
      alert(`Action failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdating(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await updateOrderStatus(order.id, 'delivered', undefined, base64String);
          alert('Proof of delivery photo saved! Order marked as delivered.');
        } catch (error: any) {
          console.error('Delivery update failed:', error);
          alert(`Update failed: ${error.message || 'Unknown error'}`);
        } finally {
          setIsUpdating(false);
        }
      };
      
      reader.onerror = () => {
        alert('Failed to read file');
        setIsUpdating(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Photo handling failed:', error);
      alert(`Photo handling failed: ${error.message || 'Unknown error'}`);
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (order.status === 'ready_for_pickup') {
      alert('Cannot cancel order because it is already ready for pickup.');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setIsUpdating(true);
      await updateOrderStatus(order.id, 'cancelled');
    } catch (error: any) {
      console.error('Cancel failed:', error);
      alert(`Cancel failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getActionText = () => {
    if (isUpdating) return 'Updating Status...';
    const isSeller = order.sellerId === currentUser?.id;
    const isBuyer = order.buyerId === currentUser?.id;
    const isRider = role === 'rider' || currentUser?.role === 'rider';
    
    // Vendor actions (Seller logic)
    if (isSeller) {
      if (order.status === 'pending') return 'Confirm Order';
      if (order.status === 'confirmed') return 'Ready for Pickup';
      if (order.status === 'ready_for_pickup') return 'Waiting Rider';
      return '-';
    }

    // Customer actions (Buyer logic)
    if (isBuyer) {
      if (order.status === 'pending') return 'Waiting...';
      if (order.status === 'confirmed') return 'Preparing';
      if (order.status === 'ready_for_pickup') return 'Finding Rider';
      if (order.status === 'delivered') return 'Confirm Receipt & Pay';
      if (order.status === 'payment_received') return 'Completed';
      if (order.status === 'cancelled') return 'Cancelled';
      return 'In Transit';
    }

    // Rider actions
    if (isRider) {
      if (order.status === 'ready_for_pickup') return 'Accept Pickup';
      if (order.status === 'picked_up') return 'Mark Delivered (Photo Required)';
      if (order.status === 'delivered') return 'Payment Received';
      if (order.status === 'payment_received') return 'Completed';
      return 'Waiting...';
    }
    return '-';
  };

  const isActionDisabled = () => {
    if (isUpdating) return true;
    const isSeller = order.sellerId === currentUser?.id;
    const isBuyer = order.buyerId === currentUser?.id;
    const isRider = role === 'rider' || currentUser?.role === 'rider';
    
    // Seller logic
    if (isSeller) {
      return order.status !== 'pending' && order.status !== 'confirmed';
    }
    
    // Rider logic
    if (isRider) {
      if (order.status === 'payment_received' || order.status === 'cancelled') return true;
      return order.status !== 'ready_for_pickup' && order.status !== 'picked_up' && order.status !== 'delivered';
    }
    
    // Buyer logic
    if (isBuyer) {
      return order.status !== 'delivered';
    }
    
    return true;
  };

  return (
    <tr className="hover:bg-white/40 transition-all align-top block md:table-row p-4 sm:p-6 md:p-0 space-y-4 md:space-y-0">
      <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-emerald-300">#{order.id.slice(0, 8)}</span>
            <span className="text-[10px] text-emerald-200 mt-1">•</span>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">
              {order.sellerId === currentUser?.id ? `Buyer: ${buyer?.display_name || 'User'}` : `Seller: ${seller?.display_name || 'Shop'}`}
            </p>
            <span className="text-[10px] text-emerald-200 ml-auto whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>

          {(role === 'rider' || order.buyerId === currentUser?.id || role === 'admin') && order.deliveryAddress && (
            <div className="flex items-start gap-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
              <MapPin size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Delivery Address</p>
                <p className="text-[11px] font-bold text-emerald-900 leading-tight">
                  {order.deliveryAddress}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div 
                key={item.id} 
                className="flex items-center gap-3 cursor-pointer group/item"
                onClick={() => {
                  setCurrentPage('home');
                  setSelectedProductId(item.productId);
                }}
              >
                <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-emerald-50 border border-emerald-100 flex-shrink-0 group-hover/item:border-primary transition-all">
                  {item.productImage ? (
                    <img src={item.productImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Package className="w-full h-full p-1.5 text-emerald-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-900 truncate group-hover/item:text-primary transition-all">
                    {item.productName} <span className="text-primary ml-1 font-black">x{item.quantity}</span>
                  </p>
                  <p className="text-[10px] text-emerald-400 tracking-tight">₱{item.productPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </td>
      
      <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
        <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start gap-1">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest md:hidden">Total Amount</p>
          <div className="text-right md:text-left">
            <div className="font-black text-emerald-900 text-base md:text-sm">₱{order.totalAmount.toLocaleString()}</div>
            {(order.sellerId === currentUser?.id || role === 'rider') && (
              <div className="text-[10px] text-emerald-500 font-black">
                Net: {order.sellerId === currentUser?.id ? (() => {
                  const productSubtotal = order.items && order.items.length > 0
                    ? order.items.reduce((sum: number, item: any) => sum + (item.productPrice * item.quantity), 0)
                    : Math.max(0, order.totalAmount - 50);
                  return `₱${(productSubtotal * 0.9).toLocaleString()}`;
                })() : `₱45`}
              </div>
            )}
            <div className="text-[10px] text-emerald-400 font-medium">
              {order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0)} items
            </div>
          </div>
        </div>
      </td>

      <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell">
        <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start gap-2">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest md:hidden">Status</p>
          <div className="flex flex-col items-end md:items-start gap-2">
            <StatusBadge status={order.status} />
            {order.proof_photo_url && (
              <div className="group relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-100 shadow-sm cursor-pointer md:hover:w-32 md:hover:h-32 transition-all">
                <img 
                  src={order.proof_photo_url} 
                  alt="Delivery proof" 
                  className="w-full h-full object-cover"
                  onClick={() => window.open(order.proof_photo_url, '_blank')}
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white text-center py-0.5 opacity-0 group-hover:opacity-100">Proof</span>
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-0 md:px-8 py-0 md:py-5 block md:table-cell pt-2 md:pt-5 border-t border-emerald-100/50 md:border-0">
        <div className="flex flex-col gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handlePhotoUpload}
          />
          <button 
            onClick={handleAction}
            disabled={isActionDisabled()}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-4 md:py-2 rounded-2xl md:rounded-xl transition-all flex items-center justify-center gap-2 w-full ${
              (role === 'rider' && order.status === 'payment_received')
                ? 'bg-emerald-100 text-emerald-600 cursor-default shadow-none border border-emerald-200'
                : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20 disabled:opacity-30'
            }`}
          >
            {isUpdating && <Loader2 size={12} className="animate-spin" />}
            <span className="truncate">{getActionText()}</span>
          </button>
          {(order.buyerId === currentUser?.id || order.sellerId === currentUser?.id) && (order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready_for_pickup') && (
            <button 
              onClick={handleCancel}
              disabled={isUpdating || order.status === 'ready_for_pickup'}
              className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest px-4 py-3 md:py-1 flex items-center justify-center gap-1 transition-all disabled:opacity-30 border border-red-100 md:border-transparent hover:border-red-100 rounded-2xl md:rounded-lg w-full"
            >
              <AlertCircle size={12} />
              Cancel Order
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: any = {
    pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    confirmed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    ready_for_pickup: { color: 'bg-indigo-100 text-indigo-700', icon: Bike },
    picked_up: { color: 'bg-indigo-500 text-white', icon: MapPin },
    delivered: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCheck },
    payment_received: { color: 'bg-emerald-900 text-white', icon: DollarSign },
    cancelled: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
    return: { color: 'bg-rose-100 text-rose-700', icon: Package },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${config.color}`}>
      <Icon size={12} strokeWidth={3} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}
