import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Eye, EyeOff, AlertCircle, User, Phone, Lock,
  BarChart3, Users, ShoppingCart, Warehouse, Receipt,
  FileText, CreditCard, RotateCcw, ArrowRight,
} from 'lucide-react';

const adminFeatures = [
  { icon: BarChart3,    label: 'Analytics Dashboard',      desc: 'Real-time sales and debt overview' },
  { icon: Users,        label: 'Customer Management',       desc: 'Track credit, payments and returns' },
  { icon: ShoppingCart, label: 'Orders & Invoicing',        desc: 'Create and manage customer orders' },
  { icon: Warehouse,    label: 'Warehouse / Inventory',     desc: 'Stock levels and purchase history' },
  { icon: Receipt,      label: 'Expense Tracking',          desc: 'Log and report business expenses' },
];

const customerFeatures = [
  { icon: CreditCard,   label: 'Account Balance',           desc: 'See exactly what you owe or are owed' },
  { icon: ShoppingCart, label: 'Order History',             desc: 'Browse every order and its status' },
  { icon: RotateCcw,    label: 'Returns',                   desc: 'View all recorded product returns' },
  { icon: FileText,     label: 'Download Statement',        desc: 'PDF statement filtered by date range' },
];

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('customer'); // 'customer' | 'staff'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Customer fields
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');

  // Staff fields
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const switchMode = (m) => {
    setMode(m);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'customer') {
        const res  = await fetch('/api/portal/lookup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name: name.trim(), phone: phone.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'No account found with that name and phone number.');
          return;
        }
        sessionStorage.setItem('portalToken',      data.token);
        sessionStorage.setItem('portalCustomerId', data.customerId);
        router.push(`/portal/${data.customerId}`);
      } else {
        const res  = await fetch('/api/auth/login', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Invalid credentials.');
          return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user',  JSON.stringify(data.user));
        router.push('/dashboard');
      }
    } catch {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = mode === 'customer';
  const features   = isCustomer ? customerFeatures : adminFeatures;
  const canSubmit  = isCustomer
    ? name.trim() && phone.trim()
    : username && password;

  return (
    <>
      <Head>
        <title>{isCustomer ? 'Customer Portal' : 'Staff Login'} — BGE</title>
      </Head>

      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ── LEFT — branding & features ─────────────────────────────── */}
        <div className="lg:w-5/12 bg-gradient-to-br from-bge-green via-green-700 to-emerald-900 flex flex-col justify-between p-8 lg:p-12 text-white">

          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-10 lg:mb-14">
              <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-white text-lg">B</span>
              </div>
              <div>
                <p className="font-bold text-white text-sm tracking-wide leading-none">BEN GLOBAL ENTERPRISES</p>
                <p className="text-green-200 text-xs leading-none mt-1">Credit Management System</p>
              </div>
            </div>

            {/* Dynamic headline */}
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
              {isCustomer ? (
                <>Your account,<br />at a glance.</>
              ) : (
                <>Manage credit.<br />Stay in control.</>
              )}
            </h1>
            <p className="text-green-100 text-sm leading-relaxed max-w-xs mb-8">
              {isCustomer
                ? 'View your balance, browse your orders, and download your statement — all in one place.'
                : 'A complete credit management platform for tracking customers, orders, payments, and inventory.'
              }
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white bg-opacity-15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-none">{label}</p>
                    <p className="text-green-200 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address footer */}
          <div className="mt-10 pt-6 border-t border-white border-opacity-20 hidden lg:block">
            <p className="text-green-200 text-xs leading-relaxed">
              18 Bishop Okoye Street, Opp. Mile 3 Market,<br />Diobu, Port Harcourt
            </p>
            <p className="text-green-200 text-xs mt-1">Tel: 08068609964</p>
          </div>
        </div>

        {/* ── RIGHT — login form ──────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 lg:p-12">
          <div className="w-full max-w-md">

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-500 text-sm mb-6">Choose how you want to sign in.</p>

            {/* Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('customer')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isCustomer
                    ? 'bg-white text-bge-green shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => switchMode('staff')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !isCustomer
                    ? 'bg-white text-bge-green shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Staff / Admin
              </button>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">

                {isCustomer ? (
                  <>
                    <div>
                      <label className="label">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="input-field pl-10"
                          placeholder="As registered on your account"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="input-field pl-10"
                          placeholder="e.g. 08012345678"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="label">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className="input-field pl-10"
                          placeholder="Enter your username"
                          autoComplete="username"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="input-field pl-10 pr-10"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 rounded-xl text-base"
                >
                  {loading ? (
                    <><Spinner />{isCustomer ? 'Looking up...' : 'Signing in...'}</>
                  ) : (
                    <>{isCustomer ? 'View My Account' : 'Sign In'}<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-5 pt-5 border-t border-gray-100 text-xs text-center text-gray-400">
                {isCustomer
                  ? 'This is a read-only portal. No changes can be made here.'
                  : 'Authorised staff only. All actions are logged.'
                }
              </p>
            </div>

            {/* Help */}
            <p className="text-center text-xs text-gray-400 mt-5">
              Need help?{' '}
              <a href="tel:08068609964" className="text-bge-green font-medium hover:underline">
                Call 08068609964
              </a>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
