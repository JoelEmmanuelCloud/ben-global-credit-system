import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Setup completed successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Setup failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Setup - BGE Credit Management</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bge-green to-bge-light-green">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-bge-green mb-2">Initial Setup</h1>
            <p className="text-gray-600">Create your admin account</p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <p className="font-semibold mb-2">Default Credentials:</p>
              <p>Username: <span className="font-mono">BenGlobal</span></p>
              <p>Password: <span className="font-mono">08068609964</span></p>
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Create Admin Account'}
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full btn-secondary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}