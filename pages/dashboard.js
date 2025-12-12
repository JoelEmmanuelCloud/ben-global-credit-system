// pages/dashboard.js
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, ShoppingCart, DollarSign, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      <>
        <Head>
          <title>Dashboard - BGE Credit Management</title>
        </Head>
        <Layout title="Dashboard">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-600">Loading dashboard...</div>
          </div>
        </Layout>
      </>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Total Customers */}
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm mb-1">Total Customers</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats?.totalCustomers || 0}</p>
              </div>
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Total Orders */}
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-100 text-xs sm:text-sm mb-1">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats?.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-green-200 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Total Debt */}
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-red-100 text-xs sm:text-sm mb-1">Total Debt</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">₦{stats?.totalDebt?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-red-200 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Customers with Debt */}
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-orange-100 text-xs sm:text-sm mb-1">Customers with Debt</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats?.customersWithDebt || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-200 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Unpaid Orders */}
          <div className="card bg-red-50 border-l-4 border-red-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">Unpaid Orders</h3>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats?.unpaidOrders || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 ml-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          {/* Partial Payments */}
          <div className="card bg-yellow-50 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">Partial Payments</h3>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats?.partialOrders || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 ml-2">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          {/* Paid Orders */}
          <div className="card bg-green-50 border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">Paid Orders</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.paidOrders || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 ml-2">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Debt Chart */}
        <div className="card mb-6 md:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Monthly Credit Issued <span className="text-sm font-normal text-gray-500">(Last 12 Months)</span>
          </h3>
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[500px] px-4 sm:px-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => `₦${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="debt" fill="#dc2626" name="Credit Issued" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" fill="#22c55e" name="Amount Paid" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Debtors */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Top Debtors</h3>
            {customers && customers.length > 0 && (
              <span className="text-sm text-gray-500">Showing top {Math.min(10, customers.length)}</span>
            )}
          </div>
          
          {customers && customers.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Debt
                      </th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.slice(0, 10).map((customer, index) => (
                      <tr 
                        key={customer._id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/customers/${customer._id}`)}
                      >
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-semibold">
                          ₦{customer.totalDebt.toLocaleString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm">
                          <ChevronRight className="w-5 h-5 text-gray-400 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {customers.slice(0, 10).map((customer, index) => (
                  <div
                    key={customer._id}
                    onClick={() => router.push(`/customers/${customer._id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer active:bg-gray-200"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Outstanding debt</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span className="text-sm font-bold text-red-600">
                        ₦{customer.totalDebt.toLocaleString()}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No customers with outstanding debt</p>
              <p className="text-sm text-gray-500 mt-1">Great job keeping track of payments!</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}