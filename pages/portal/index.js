import { useState } from 'react';
import { useRouter } from 'next/router';
import PortalLayout from '../../components/PortalLayout';
import { User, Phone, AlertCircle, Eye } from 'lucide-react';

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

      // Store portal session in sessionStorage (auto-clears when tab closes)
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
    <PortalLayout title="View Your Account">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-bge-green bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-bge-green" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">View Your Account</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter the name and phone number registered with your account to view your balance and statement.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !phone.trim()}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Looking up...' : 'View My Account'}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-400">
            This portal is read-only. No changes can be made to your account here.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Having trouble? Contact us at <span className="text-bge-green font-medium">08068609964</span>
        </p>
      </div>
    </PortalLayout>
  );
}
