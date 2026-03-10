import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { User, Phone, AlertCircle, FileText, ShoppingCart, CreditCard, ArrowRight } from 'lucide-react';

const features = [
  { icon: ShoppingCart, label: 'Order History' },
  { icon: CreditCard, label: 'Payment Records' },
  { icon: FileText, label: 'Download Statement' },
];

export default function PortalLookup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      sessionStorage.setItem('portalToken', data.token);
      sessionStorage.setItem('portalCustomerId', data.customerId);
      router.push(`/portal/${data.customerId}`);
    } catch {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer Portal - BGE</title>
      </Head>

      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ── Left panel — branding ── */}
        <div className="lg:w-5/12 bg-gradient-to-br from-bge-green via-green-700 to-emerald-900 flex flex-col justify-between p-8 lg:p-12 text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12 lg:mb-16">
              <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                <span className="font-bold text-white text-lg">B</span>
              </div>
              <div>
                <p className="font-bold text-white leading-none text-sm tracking-wide">BEN GLOBAL</p>
                <p className="text-green-200 text-xs leading-none mt-0.5">ENTERPRISES</p>
              </div>
            </div>

            {/* Hero text */}
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              Your account,<br />at a glance.
            </h1>
            <p className="text-green-100 text-sm lg:text-base leading-relaxed max-w-xs">
              View your balance, browse your order history, and download your account statement — all in one place.
            </p>

            {/* Feature pills */}
            <div className="mt-8 lg:mt-10 flex flex-col gap-3">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white bg-opacity-15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-green-100 text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white border-opacity-20 hidden lg:block">
            <p className="text-green-200 text-xs">
              18 Bishop Okoye Street, Opp. Mile 3 Market,<br />
              Diobu, Port Harcourt
            </p>
            <p className="text-green-200 text-xs mt-1">Tel: 08068609964</p>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 lg:p-12">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">View your account</h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter the name and phone number on your account.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="e.g. CHIDI BISHOP"
                      autoComplete="name"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Use the name registered with your account</p>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-10"
                      placeholder="e.g. 08012345678"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !phone.trim()}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 rounded-xl text-base"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Looking up...
                    </>
                  ) : (
                    <>
                      View My Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-xs text-center text-gray-400 border-t border-gray-100 pt-5">
                This is a read-only portal. No changes can be made here.
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              Need help?{' '}
              <a href="tel:08068609964" className="text-bge-green font-medium hover:underline">
                Call 08068609964
              </a>
            </p>

            <p className="text-center text-xs text-gray-400 mt-2">
              <a href="/login" className="hover:text-gray-600 transition-colors">Staff login →</a>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
