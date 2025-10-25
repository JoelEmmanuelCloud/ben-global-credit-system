import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import Head from 'next/head';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  const { stats, customers, chartData } = analytics || {};

  return (
    <>
      <Head>
        <title>Dashboard - BGE Credit Management</title>
      </Head>
      <Layout title="Dashboard">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Customers</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalCustomers || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Orders</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Debt</p>
                <p className="text-3xl font-bold mt-2">₦{stats?.totalDebt?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="w-12 h-12 text-red-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Customers with Debt</p>
                <p className="text-3xl font-bold mt-2">{stats?.customersWithDebt || 0}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card bg-red-50 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Unpaid Orders</h3>
            <p className="text-3xl font-bold text-red-600">{stats?.unpaidOrders || 0}</p>
          </div>
          
          <div className="card bg-yellow-50 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Partial Payments</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.partialOrders || 0}</p>
          </div>
          
          <div className="card bg-green-50 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Paid Orders</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.paidOrders || 0}</p>
          </div>
        </div>

        {/* Monthly Debt Chart */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Credit Issued (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₦${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="debt" fill="#dc2626" name="Credit Issued" />
              <Bar dataKey="paid" fill="#22c55e" name="Amount Paid" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Debtors */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Debtors</h3>
          {customers && customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Debt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.slice(0, 10).map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">
                        ₦{customer.totalDebt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No customers with outstanding debt</p>
          )}
        </div>
      </Layout>
    </>
  );
}