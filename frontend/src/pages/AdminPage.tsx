import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  BarChart3,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  IndianRupee,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  revenue: { total: number; thisMonth: number; change: string | number };
  orders:  { total: number; thisMonth: number; pending: number; change: string | number };
  users:   { total: number; thisMonth: number; change: string | number };
  products:{ total: number; lowStock: number };
}

interface RecentOrder {
  _id: string;
  user: { name: string; email: string };
  totalPrice: number;
  orderStatus: string;
  isPaid: boolean;
  createdAt: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const statusColors: Record<string, string> = {
  Processing: 'bg-yellow-500/20 text-yellow-400',
  Confirmed:  'bg-blue-500/20   text-blue-400',
  Shipped:    'bg-purple-500/20 text-purple-400',
  Delivered:  'bg-green-500/20  text-green-400',
  Cancelled:  'bg-red-500/20    text-red-400',
};

const statusIcon: Record<string, React.ReactNode> = {
  Processing: <Clock       size={12} />,
  Confirmed:  <CheckCircle size={12} />,
  Shipped:    <Truck       size={12} />,
  Delivered:  <CheckCircle size={12} />,
  Cancelled:  <XCircle     size={12} />,
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  sub,
  change,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  change?: string | number;
  accent: string;
}) => {
  const isPositive = Number(change) >= 0;
  return (
    <div className="admin-card">
      <div className={`admin-card__icon ${accent}`}>{icon}</div>
      <div className="admin-card__body">
        <p className="admin-card__label">{label}</p>
        <p className="admin-card__value">{value}</p>
        {sub && <p className="admin-card__sub">{sub}</p>}
      </div>
      {change !== undefined && (
        <div className={`admin-card__badge ${isPositive ? 'admin-card__badge--up' : 'admin-card__badge--down'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(Number(change))}%
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const AdminPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats,      setStats]      = useState<DashboardStats | null>(null);
  const [recent,     setRecent]     = useState<RecentOrder[]>([]);
  const [lowStock,   setLowStock]   = useState<LowStockProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Guard — must be logged-in admin
  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    if (user?.role !== 'admin') { navigate('/'); }
  }, [isAuthenticated, user, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, recentRes, lowRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentOrders(8),
        api.getLowStock(5),
      ]);
      setStats(statsRes.stats);
      setRecent(recentRes.orders);
      setLowStock(lowRes.products);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      setRecent(prev =>
        prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o)
      );
    } catch (e: any) {
      alert('Update failed: ' + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Welcome back, {user?.name}</p>
        </div>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="admin-skeleton-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="admin-skeleton" />)}
        </div>
      ) : stats && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <div className="admin-stats-grid">
            <StatCard
              icon={<IndianRupee size={20} />}
              label="Total Revenue"
              value={fmt(stats.revenue.total)}
              sub={`${fmt(stats.revenue.thisMonth)} this month`}
              change={stats.revenue.change}
              accent="accent-green"
            />
            <StatCard
              icon={<ShoppingBag size={20} />}
              label="Total Orders"
              value={stats.orders.total.toLocaleString()}
              sub={`${stats.orders.pending} pending`}
              change={stats.orders.change}
              accent="accent-blue"
            />
            <StatCard
              icon={<Users size={20} />}
              label="Total Users"
              value={stats.users.total.toLocaleString()}
              sub={`+${stats.users.thisMonth} this month`}
              change={stats.users.change}
              accent="accent-purple"
            />
            <StatCard
              icon={<Package size={20} />}
              label="Products"
              value={stats.products.total.toLocaleString()}
              sub={`${stats.products.lowStock} low stock`}
              accent="accent-orange"
            />
          </div>

          {/* ── Bottom Panels ──────────────────────────────────────────────── */}
          <div className="admin-panels">
            {/* Recent Orders */}
            <section className="admin-panel">
              <div className="admin-panel__head">
                <BarChart3 size={18} />
                <h2>Recent Orders</h2>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(order => (
                      <tr key={order._id}>
                        <td>
                          <p className="font-medium">{order.user?.name}</p>
                          <p className="text-xs text-neutral-400">{order.user?.email}</p>
                        </td>
                        <td className="font-semibold">{fmt(order.totalPrice)}</td>
                        <td>
                          <span className={`status-chip ${order.isPaid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {order.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-chip ${statusColors[order.orderStatus] || ''}`}>
                            {statusIcon[order.orderStatus]}
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="text-xs text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td>
                          <select
                            className="admin-select"
                            value={order.orderStatus}
                            disabled={updatingId === order._id}
                            onChange={e => handleStatusChange(order._id, e.target.value)}
                          >
                            {['Processing','Confirmed','Shipped','Delivered','Cancelled'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Low Stock Alerts */}
            <section className="admin-panel admin-panel--narrow">
              <div className="admin-panel__head">
                <AlertTriangle size={18} className="text-yellow-400" />
                <h2>Low Stock Alerts</h2>
              </div>
              {lowStock.length === 0 ? (
                <p className="admin-empty">All products are well stocked 🎉</p>
              ) : (
                <ul className="admin-stock-list">
                  {lowStock.map(p => (
                    <li key={p._id} className="admin-stock-item">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-neutral-400">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <span className={`stock-badge ${p.stock === 0 ? 'stock-badge--out' : 'stock-badge--low'}`}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                        </span>
                        <p className="text-xs text-neutral-400 mt-0.5">{fmt(p.price)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};
