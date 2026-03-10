import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PortalLayout from '../../components/PortalLayout';
import { downloadCustomerReceipt } from '../../lib/pdfGenerator';
import {
  User, Phone, Mail, MapPin, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Download, LogOut, FileText,
  ShoppingCart, RotateCcw, CreditCard, X, Calendar,
} from 'lucide-react';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'By Month' },
  { value: 'year', label: 'By Year' },
  { value: 'week', label: 'By Week' },
  { value: 'custom', label: 'Custom Range' },
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getPeriodLabel(filter) {
  const { type, month, year, weekDate, startDate, endDate } = filter;
  if (type === 'all') return 'All Time';
  if (type === 'month' && month && year) return `${MONTHS[parseInt(month) - 1]} ${year}`;
  if (type === 'year' && year) return `Year ${year}`;
  if (type === 'week' && weekDate) {
    const d = new Date(weekDate);
    const start = new Date(d); start.setDate(d.getDate() - d.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return `Week of ${start.toLocaleDateString('en-GB')} – ${end.toLocaleDateString('en-GB')}`;
  }
  if (type === 'custom' && startDate && endDate) {
    return `${new Date(startDate).toLocaleDateString('en-GB')} – ${new Date(endDate).toLocaleDateString('en-GB')}`;
  }
  return 'All Time';
}

function filterOrders(orders, filter) {
  const { type, month, year, weekDate, startDate, endDate } = filter;
  if (type === 'all' || !orders) return orders || [];

  return orders.filter(order => {
    const d = new Date(order.createdAt);
    if (type === 'month') return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    if (type === 'year') return d.getFullYear() === parseInt(year);
    if (type === 'week' && weekDate) {
      const ref = new Date(weekDate);
      const start = new Date(ref); start.setDate(ref.getDate() - ref.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return d >= start && d <= end;
    }
    if (type === 'custom' && startDate && endDate) {
      return d >= new Date(startDate) && d <= new Date(endDate + 'T23:59:59');
    }
    return true;
  });
}

function filterPayments(payments, filter) {
  const { type, month, year, weekDate, startDate, endDate } = filter;
  if (type === 'all' || !payments) return payments || [];

  return payments.filter(p => {
    const d = new Date(p.date);
    if (type === 'month') return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    if (type === 'year') return d.getFullYear() === parseInt(year);
    if (type === 'week' && weekDate) {
      const ref = new Date(weekDate);
      const start = new Date(ref); start.setDate(ref.getDate() - ref.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return d >= start && d <= end;
    }
    if (type === 'custom' && startDate && endDate) {
      return d >= new Date(startDate) && d <= new Date(endDate + 'T23:59:59');
    }
    return true;
  });
}

function StatCard({ label, value, color = 'gray', icon: Icon }) {
  const colors = {
    red:    'bg-red-50 border-red-200 text-red-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`border rounded-xl p-3 sm:p-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />}
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide truncate">{label}</p>
      </div>
      <p className="text-base sm:text-xl font-bold truncate">{value}</p>
    </div>
  );
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const fmt = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  const status = order.status || 'unpaid';
  const statusStyle = {
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    unpaid: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{fmt(order.totalAmount)}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4 space-y-2">
          {order.products.map((p, i) => (
            <div key={i} className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium truncate">{p.name}</p>
                <p className="text-gray-400 mt-0.5">
                  {p.quantity} × {fmt(p.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-gray-900 flex-shrink-0">{fmt(p.totalPrice)}</p>
            </div>
          ))}

          <div className="pt-1 space-y-1 text-xs">
            <div className="flex justify-between font-semibold text-gray-800">
              <span>Order Total</span>
              <span>{fmt(order.totalAmount)}</span>
            </div>
            {order.amountPaid > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Amount Paid</span>
                <span className="font-medium">{fmt(order.amountPaid)}</span>
              </div>
            )}
            {order.balance > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Balance Due</span>
                <span className="font-medium">{fmt(order.balance)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatementModal({ customer, orders, payments, onClose }) {
  const currentYear = new Date().getFullYear();
  const [filter, setFilter] = useState({
    type: 'all',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(currentYear),
    weekDate: '',
    startDate: '',
    endDate: '',
  });
  const [downloading, setDownloading] = useState(false);

  const set = (key, val) => setFilter(f => ({ ...f, [key]: val }));

  const filteredOrders = filterOrders(orders, filter);
  const filteredPayments = filterPayments(payments, filter);
  const periodLabel = getPeriodLabel(filter);

  const hasData = filteredOrders.length > 0 || filteredPayments.length > 0;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const customerForPdf = {
        ...customer,
        payments: filteredPayments,
      };
      downloadCustomerReceipt(customerForPdf, filteredOrders, { periodLabel });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-bge-green" />
            <h2 className="font-semibold text-gray-900">Download Statement</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="label">Statement Period</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('type', opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    filter.type === opt.value
                      ? 'bg-bge-green text-white border-bge-green'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-bge-green hover:text-bge-green'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filter.type === 'month' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <select className="input-field" value={filter.month} onChange={e => set('month', e.target.value)}>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select className="input-field" value={filter.year} onChange={e => set('year', e.target.value)}>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {filter.type === 'year' && (
            <div>
              <label className="label">Year</label>
              <select className="input-field" value={filter.year} onChange={e => set('year', e.target.value)}>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {filter.type === 'week' && (
            <div>
              <label className="label">Pick any day in that week</label>
              <input type="date" className="input-field" value={filter.weekDate} onChange={e => set('weekDate', e.target.value)} />
              {filter.weekDate && (
                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(filter)}</p>
              )}
            </div>
          )}

          {filter.type === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From</label>
                <input type="date" className="input-field" value={filter.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input-field" value={filter.endDate} onChange={e => set('endDate', e.target.value)} />
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <p className="font-medium text-gray-700 mb-2">Preview — {periodLabel}</p>
            <div className="flex justify-between text-gray-600">
              <span>Orders</span>
              <span className="font-medium">{filteredOrders.length}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Payments</span>
              <span className="font-medium">{filteredPayments.length}</span>
            </div>
            {!hasData && filter.type !== 'all' && (
              <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No activity found for this period.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || (!hasData && filter.type !== 'all')}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {downloading
              ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Generating...</>
              : <><Download className="w-4 h-4" />Download PDF</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalCustomer() {
  const router = useRouter();
  const { id } = router.query;

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatement, setShowStatement] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!id) return;

    const token = sessionStorage.getItem('portalToken');
    const storedId = sessionStorage.getItem('portalCustomerId');

    if (!token || storedId !== id) {
      router.replace('/portal');
      return;
    }

    fetch(`/api/portal/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          setError(data.message || 'Could not load your account.');
          return;
        }
        setCustomer(data.customer);
        setOrders(data.orders || []);
        setReturns(data.returns || []);
      })
      .catch(() => setError('Connection error. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('portalToken');
    sessionStorage.removeItem('portalCustomerId');
    router.push('/portal');
  };

  const fmt = (n) => `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <PortalLayout title="Loading...">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout title="Error">
        <div className="max-w-md mx-auto text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load account</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => router.push('/portal')} className="btn-primary">
            Back to Portal
          </button>
        </div>
      </PortalLayout>
    );
  }

  const payments = customer?.payments || [];
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  const tabs = [
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'returns', label: 'Returns', icon: RotateCcw, count: returns.length },
  ];

  return (
    <PortalLayout title={`${customer.name}'s Account`}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-bge-green bg-opacity-10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-bge-green" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{customer.name}</h1>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />{customer.phone}
                </span>
                {customer.email && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />{customer.email}
                  </span>
                )}
                {customer.address && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {customer.totalDebt > 0 ? (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">Outstanding Balance</p>
              <p className="text-xs text-red-400 truncate">You owe {fmt(customer.totalDebt)}</p>
            </div>
            <p className="text-base sm:text-lg font-bold text-red-600 flex-shrink-0">{fmt(customer.totalDebt)}</p>
          </div>
        ) : (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-700">Account Clear</p>
              <p className="text-xs text-green-400">No outstanding balance</p>
            </div>
            {customer.wallet > 0 && (
              <p className="text-sm font-semibold text-green-600 flex-shrink-0">
                +{fmt(customer.wallet)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Total Orders" value={fmt(orders.reduce((s, o) => s + o.totalAmount, 0))} color="blue" icon={ShoppingCart} />
        <StatCard label="Total Paid" value={fmt(totalPaid)} color="green" icon={CreditCard} />
        {customer.totalDebt > 0 && (
          <StatCard label="Balance Due" value={fmt(customer.totalDebt)} color="red" icon={AlertCircle} />
        )}
        {customer.wallet > 0 && (
          <StatCard label="Wallet Credit" value={fmt(customer.wallet)} color="purple" icon={CheckCircle} />
        )}
        {customer.oldBalance > 0 && (
          <StatCard label="Opening Balance" value={fmt(customer.oldBalance)} color="orange" icon={Calendar} />
        )}
        <StatCard label="Total Returns" value={fmt(returns.reduce((s, r) => s + r.totalAmount, 0))} color="gray" icon={RotateCcw} />
      </div>

      <button
        onClick={() => setShowStatement(true)}
        className="w-full flex items-center justify-center gap-2 bg-white border border-bge-green text-bge-green hover:bg-bge-green hover:text-white transition-all rounded-xl py-3 font-semibold text-sm mb-5"
      >
        <Download className="w-4 h-4" />
        Download Account Statement
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-bge-green border-b-2 border-bge-green bg-green-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                    isActive ? 'bg-bge-green text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                orders.map(order => <OrderCard key={order._id} order={order} />)
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-2">
              {payments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No payments recorded</p>
                </div>
              ) : (
                [...payments].sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{fmt(p.amount)}</p>
                      {p.note && <p className="text-xs text-gray-500 mt-0.5">{p.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <span className="text-xs text-green-600 font-medium">Recorded</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-3">
              {returns.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No returns recorded</p>
                </div>
              ) : (
                returns.map(ret => (
                  <div key={ret._id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ret.returnNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ret.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-yellow-700">{fmt(ret.totalAmount)}</p>
                    </div>
                    {ret.reason && (
                      <p className="text-xs text-gray-500 mb-2 italic">"{ret.reason}"</p>
                    )}
                    <div className="space-y-1">
                      {ret.products.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-600">
                          <span>{p.name} × {p.quantity}</span>
                          <span>{fmt(p.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showStatement && (
        <StatementModal
          customer={customer}
          orders={orders}
          payments={payments}
          onClose={() => setShowStatement(false)}
        />
      )}
    </PortalLayout>
  );
}
