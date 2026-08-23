import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, MapPin, Heart, CreditCard, LogOut, ChevronRight, Edit2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

type Tab = 'overview' | 'orders' | 'addresses' | 'wishlist' | 'settings';

const statusColors: Record<string, string> = {
  Delivered:  'bg-green-100 text-green-700',
  Shipped:    'bg-blue-100 text-blue-700',
  Processing: 'bg-amber-100 text-amber-700',
  Cancelled:  'bg-red-100 text-red-700',
};

interface BackendOrder {
  _id: string;
  createdAt: string;
  orderStatus: string;
  totalPrice: number;
  orderItems: { name: string; image: string; quantity: number }[];
}

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Load orders whenever the user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setOrdersLoading(true);
    setOrdersError('');
    api.getMyOrders()
      .then(data => setOrders(data.orders || []))
      .catch(err => {
        console.error('Failed to load orders:', err);
        setOrdersError(err.message || 'Failed to load orders');
        setOrders([]);
      })
      .finally(() => setOrdersLoading(false));
  }, [isAuthenticated]);


  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-custom py-24 text-center">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Please sign in</h2>
          <button onClick={() => navigate('/auth')} className="btn-primary px-8">Sign In</button>
        </div>
      </Layout>
    );
  }

  const handleLogout = () => {
    logout();
    addToast('Signed out successfully', 'success');
    navigate('/');
  };

  const navItems = [
    { id: 'overview',   icon: <User className="w-4 h-4" />,        label: 'Overview' },
    { id: 'orders',     icon: <Package className="w-4 h-4" />,     label: 'Orders' },
    { id: 'addresses',  icon: <MapPin className="w-4 h-4" />,      label: 'Addresses' },
    { id: 'wishlist',   icon: <Heart className="w-4 h-4" />,       label: 'Wishlist' },
    { id: 'settings',   icon: <CreditCard className="w-4 h-4" />,  label: 'Settings' },
  ];

  const OrderCard = ({ order }: { order: BackendOrder }) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const firstImage = order.orderItems[0]?.image || 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=80';
    return (
      <div
        onClick={() => navigate(`/orders/${order._id}`)}
        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:border-gray-300 transition-colors"
      >
        <img src={firstImage} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-0.5">{date} · {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900">₹{order.totalPrice.toLocaleString('en-IN')}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
            {order.orderStatus}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    );
  };

  return (
    <Layout>
      <div className="container-custom py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </nav>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Orders',   value: orders.length },
                    { label: 'Delivered',       value: orders.filter(o => o.orderStatus === 'Delivered').length },
                    { label: 'In Progress',     value: orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl shadow-card p-5 text-center">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-8">
                      <Package className="w-10 h-10 text-red-200 mx-auto mb-3" />
                      <p className="text-sm text-red-500 mb-1">Could not load orders</p>
                      <p className="text-xs text-gray-400 mb-4">{ordersError.includes('401') || ordersError.includes('authorized') ? 'Your session has expired. Please sign in again.' : ordersError}</p>
                      <button onClick={() => { logout(); navigate('/auth'); }} className="btn-primary px-6 text-sm">Sign In Again</button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No orders yet</p>
                      <button onClick={() => navigate('/products')} className="btn-primary mt-4 px-6 text-sm">Shop Now</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 3).map(o => <OrderCard key={o._id} order={o} />)}
                    </div>
                  )}
                  {orders.length > 3 && (
                    <button onClick={() => setActiveTab('orders')} className="text-sm text-gray-600 hover:text-gray-900 mt-4 block">
                      View all {orders.length} orders →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* All Orders */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-gray-900 mb-6">My Orders</h3>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
                    <button onClick={() => navigate('/products')} className="btn-primary px-6">Start Shopping</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(o => <OrderCard key={o._id} order={o} />)}
                  </div>
                )}
              </div>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Saved Addresses</h3>
                  <button className="btn-primary px-4 py-2 text-sm">+ Add Address</button>
                </div>
                {(user?.addresses || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No addresses saved yet.</div>
                ) : (
                  user?.addresses.map(addr => (
                    <div key={addr.id} className="border border-gray-200 rounded-2xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          {addr.isDefault && <span className="badge bg-green-100 text-green-700 mb-2">Default</span>}
                          <p className="font-semibold text-gray-900">{addr.fullName}</p>
                          <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}, {addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                        </div>
                        <button className="btn-ghost p-2"><Edit2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">My Wishlist</h3>
                <Link to="/wishlist" className="btn-primary px-6">View Wishlist</Link>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
                <h3 className="font-semibold text-gray-900">Profile Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input className="input-base" defaultValue={user?.name} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                    <input className="input-base" defaultValue={user?.email} type="email" />
                  </div>
                </div>
                <button onClick={() => addToast('Profile updated!', 'success')} className="btn-primary px-6">Save Changes</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};
