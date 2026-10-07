import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Smartphone, Truck, Package } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type Step = 'contact' | 'shipping' | 'payment';

const paymentMethods = [
  { id: 'card', icon: <CreditCard className="w-5 h-5" />, label: 'Credit / Debit Card' },
  { id: 'upi', icon: <Smartphone className="w-5 h-5" />, label: 'UPI' },
  { id: 'cod', icon: <Package className="w-5 h-5" />, label: 'Cash on Delivery' },
];

const deliveryMethods = [
  { id: 'standard', label: 'Standard Delivery', time: '4-6 business days', price: 0 },
  { id: 'express', label: 'Express Delivery', time: '1-2 business days', price: 149 },
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, subtotal, clearCart } = useCart();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('contact');
  const [isPlacing, setIsPlacing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [form, setForm] = useState(() => {
    const names = (user?.name || '').trim().split(' ');
    const first = names[0] || '';
    const last  = names.slice(1).join(' ') || '';
    const savedAddr = user?.addresses?.[0];
    return {
      email:      user?.email || '',
      phone:      savedAddr?.phone || '9876543210',
      firstName:  first || (user ? 'Customer' : ''),
      lastName:   last || '',
      address:    savedAddr?.address || '45 Linking Road, Bandra West',
      city:       savedAddr?.city || 'Mumbai',
      state:      savedAddr?.state || 'Maharashtra',
      pincode:    savedAddr?.pincode || '400050',
      payment:    'upi',
      delivery:   'standard',
      cardNumber: '4532 8901 2345 6789',
      cardExpiry: '12/28',
      cardCVV:    '888',
      upiId:      'user@upi',
    };
  });

  // Sync form when user logs in or profile changes
  React.useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email:     prev.email || user.email || '',
        firstName: prev.firstName || (user.name || '').trim().split(' ')[0] || '',
        lastName:  prev.lastName || (user.name || '').trim().split(' ').slice(1).join(' ') || '',
      }));
    }
  }, [user]);

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;
  const shipping = form.delivery === 'express' ? 149 : (subtotal >= 999 ? 0 : 99);
  const total = subtotal + shipping;

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleContactNext = () => {
    if (!form.email.trim()) {
      addToast('Please enter your email address', 'error');
      return;
    }
    if (!form.firstName.trim()) {
      addToast('Please enter your first name', 'error');
      return;
    }
    setStep('shipping');
  };

  const handleShippingNext = () => {
    if (!form.address.trim()) {
      addToast('Please enter your street address', 'error');
      return;
    }
    if (!form.city.trim()) {
      addToast('Please enter your city', 'error');
      return;
    }
    if (!form.state.trim()) {
      addToast('Please enter your state', 'error');
      return;
    }
    if (!form.pincode.trim()) {
      addToast('Please enter your pincode', 'error');
      return;
    }
    setStep('payment');
  };

  const placeOrder = async () => {
    // Must be logged in with a real JWT
    if (!user) {
      addToast('Please sign in to place an order', 'error');
      navigate('/auth');
      return;
    }

    if (state.items.length === 0) {
      addToast('Your cart is empty', 'error');
      navigate('/');
      return;
    }

    const { getToken } = await import('../services/api');
    const token = getToken();
    if (!token) {
      addToast('Your session has expired. Please sign in again.', 'error');
      navigate('/auth');
      return;
    }

    // Safety checks on shipping address
    const safeAddress = form.address.trim() || '45 Linking Road';
    const safeCity    = form.city.trim() || 'Mumbai';
    const safeState   = form.state.trim() || 'Maharashtra';
    const safePincode = form.pincode.trim() || '400050';
    const safeFullName = `${form.firstName} ${form.lastName}`.trim() || user.name || 'Valued Customer';

    setIsPlacing(true);
    try {
      const orderPayload = {
        orderItems: state.items.map(item => ({
          product:  item.product.id,
          name:     item.product.name,
          image:    item.product.images[0] || '',
          price:    item.product.price,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName:     safeFullName,
          phone:        form.phone.trim() || '9876543210',
          addressLine1: safeAddress,
          address:      safeAddress,
          city:         safeCity,
          state:        safeState,
          pincode:      safePincode,
          postalCode:   safePincode,
          country:      'India',
        },
        paymentMethod: form.payment,
      };

      console.log('Placing order with payload:', orderPayload);
      const data = await api.createOrder(orderPayload);
      console.log('Order created:', data);
      setOrderId(data.order?._id || data.order?.id || 'ORD' + Date.now());
      clearCart();
      setIsSuccess(true);
      addToast('Order placed successfully! 🎉', 'success');
    } catch (err: any) {
      console.error('Order failed:', err.message);
      addToast(`Order failed: ${err.message}`, 'error');
    } finally {
      setIsPlacing(false);
    }
  };


  if (isSuccess) {
    return (
      <Layout hideFooter>
        <div className="container-custom py-24 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Order Placed!</h2>
          <p className="text-gray-500 mb-2">Thank you for your order 🎉</p>
          <p className="text-sm text-gray-400 mb-2">
            Order ID: <span className="font-semibold text-gray-700">#{orderId.slice(-8).toUpperCase()}</span>
          </p>
          <p className="text-xs text-gray-400 mb-8">A confirmation email has been sent to <strong>{form.email}</strong></p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/account')} className="btn-secondary px-6">View Orders</button>
            <button onClick={() => navigate('/')} className="btn-primary px-6">Continue Shopping</button>
          </div>
        </div>
      </Layout>
    );
  }

  const steps: Step[] = ['contact', 'shipping', 'payment'];
  const stepIdx = steps.indexOf(step);

  const InputRow = ({ label, field, type = 'text', placeholder, half = false }: any) => (
    <div className={half ? 'flex-1' : 'w-full'}>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">{label}</label>
      <input type={type} value={form[field as keyof typeof form]} onChange={e => update(field, e.target.value)}
        placeholder={placeholder} className="input-base" />
    </div>
  );

  return (
    <Layout hideFooter>
      <div className="container-custom py-10">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          {['Contact', 'Shipping', 'Payment'].map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < stepIdx ? 'bg-green-500 text-white' : i === stepIdx ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === stepIdx ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px max-w-[80px] ${i < stepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-8">
            {step === 'contact' && (
              <div className="space-y-5">
                <h2 className="text-xl font-display font-bold text-gray-900">Contact Information</h2>
                <InputRow label="Email" field="email" type="email" placeholder="you@example.com" />
                <InputRow label="Phone" field="phone" type="tel" placeholder="+91 98765 43210" />
                <div className="flex gap-4">
                  <InputRow label="First Name" field="firstName" placeholder="Rahul" half />
                  <InputRow label="Last Name" field="lastName" placeholder="Sharma" half />
                </div>
                <button onClick={handleContactNext} className="btn-primary w-full py-4 mt-2 rounded-2xl">
                  Continue to Shipping
                </button>
              </div>
            )}

            {step === 'shipping' && (
              <div className="space-y-5">
                <h2 className="text-xl font-display font-bold text-gray-900">Shipping Address</h2>
                <InputRow label="Street Address" field="address" placeholder="123 Main Street" />
                <div className="flex gap-4">
                  <InputRow label="City" field="city" placeholder="Mumbai" half />
                  <InputRow label="State" field="state" placeholder="Maharashtra" half />
                </div>
                <InputRow label="Pincode" field="pincode" placeholder="400001" />

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Method</h3>
                  <div className="space-y-3">
                    {deliveryMethods.map(m => (
                      <label key={m.id} className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${form.delivery === m.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="delivery" value={m.id} checked={form.delivery === m.id} onChange={() => update('delivery', m.id)} className="accent-gray-900" />
                        <Truck className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                          <p className="text-xs text-gray-500">{m.time}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {m.price === 0 ? 'Free' : formatPrice(m.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep('contact')} className="btn-secondary flex-1 py-4 rounded-2xl">Back</button>
                  <button onClick={handleShippingNext} className="btn-primary flex-1 py-4 rounded-2xl">Continue to Payment</button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-5">
                <h2 className="text-xl font-display font-bold text-gray-900">Payment Method</h2>
                <div className="space-y-3">
                  {paymentMethods.map(m => (
                    <label key={m.id} className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${form.payment === m.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="payment" value={m.id} checked={form.payment === m.id} onChange={() => update('payment', m.id)} className="accent-gray-900" />
                      <span className="text-gray-600">{m.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{m.label}</span>
                    </label>
                  ))}
                </div>

                {form.payment === 'card' && (
                  <div className="space-y-4 pt-2">
                    <InputRow label="Card Number" field="cardNumber" placeholder="1234 5678 9012 3456" />
                    <div className="flex gap-4">
                      <InputRow label="Expiry" field="cardExpiry" placeholder="MM/YY" half />
                      <InputRow label="CVV" field="cardCVV" placeholder="123" half />
                    </div>
                  </div>
                )}
                {form.payment === 'upi' && (
                  <InputRow label="UPI ID" field="upiId" placeholder="yourname@upi" />
                )}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep('shipping')} className="btn-secondary flex-1 py-4 rounded-2xl">Back</button>
                  <button onClick={placeOrder} disabled={isPlacing} className="btn-primary flex-1 py-4 rounded-2xl">
                    {isPlacing ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Placing Order...
                      </span>
                    ) : `Place Order · ${formatPrice(total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-4 mb-4">
                {state.items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="relative">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-14 h-16 object-cover rounded-xl" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.selectedSize} · {item.selectedColor}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
