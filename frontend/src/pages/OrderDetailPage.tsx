import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, CreditCard, ChevronLeft } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { api } from '../services/api';

const statusSteps = ['Processing', 'Confirmed', 'Shipped', 'Delivered'];

const statusColors: Record<string, string> = {
  Delivered:  'bg-green-100 text-green-700',
  Shipped:    'bg-blue-100 text-blue-700',
  Processing: 'bg-amber-100 text-amber-700',
  Cancelled:  'bg-red-100 text-red-700',
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getOrder(id)
      .then(data => setOrder(data.order))
      .catch(err => setError(err.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <Layout>
        <div className="container-custom py-10 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container-custom py-24 text-center">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/account')} className="btn-primary">My Account</button>
        </div>
      </Layout>
    );
  }

  const currentStepIdx = (() => {
    switch (order.orderStatus) {
      case 'Delivered':  return 3;
      case 'Shipped':    return 2;
      case 'Confirmed':  return 1;
      default:           return 0;
    }
  })();

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <Layout>
      <div className="container-custom py-10">
        <button onClick={() => navigate('/account')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </button>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Placed on {orderDate}</p>
          </div>
          <span className={`badge text-sm px-3 py-1 ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
            {order.orderStatus}
          </span>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-6">Order Tracking</h3>
          <div className="flex items-start">
            {statusSteps.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    i <= currentStepIdx ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStepIdx ? <CheckCircle className="w-5 h-5" /> :
                     i === 0 ? <Clock className="w-4 h-4" /> :
                     i === 1 ? <Package className="w-4 h-4" /> :
                     i === 2 ? <Truck className="w-4 h-4" /> :
                     <CheckCircle className="w-4 h-4" />}
                  </div>
                  <p className={`text-xs font-medium text-center leading-tight ${
                    i <= currentStepIdx ? 'text-gray-900' : 'text-gray-400'
                  }`}>{s}</p>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-[18px] ${i < currentStepIdx ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.orderItems.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=120'}
                      alt={item.name}
                      className="w-20 h-24 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-gray-900 mt-2">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl shadow-card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </h3>
                <p className="text-sm font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-sm text-gray-600 mt-1">{order.shippingAddress.addressLine1}</p>
                <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                {order.shippingAddress.phone && (
                  <p className="text-sm text-gray-500 mt-1">{order.shippingAddress.phone}</p>
                )}
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment
              </h3>
              <p className="text-sm text-gray-700 capitalize">{order.paymentMethod}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.itemsPrice)}</span>
                </div>
                {order.taxPrice > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18%)</span>
                    <span>{formatPrice(order.taxPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={order.shippingPrice === 0 ? 'text-green-600' : ''}>
                    {order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                  <span>Total</span>
                  <span>{formatPrice(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
