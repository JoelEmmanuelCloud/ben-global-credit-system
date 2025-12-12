// pages/orders.js
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Download, Filter, ChevronRight, Calendar, User, CreditCard } from 'lucide-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { downloadCustomerReceipt } from '../lib/pdfGenerator';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerId?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const status = getCustomerStatus(order.customerId);
        return status === statusFilter;
      });
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerStatus = (customer) => {
    if (!customer) return 'unknown';
    if (customer.totalDebt === 0) return 'paid';
    if (customer.payments && customer.payments.length > 0) return 'partial';
    return 'unpaid';
  };

  const handleDownloadReceipt = async (order, e) => {
    e.stopPropagation();
    
    // Fetch customer details and all their orders for the statement
    try {
      const res = await fetch(`/api/customers/${order.customerId._id}`);
      const data = await res.json();
      if (data.success) {
        downloadCustomerReceipt(data.customer, data.orders);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Error downloading receipt');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'partial':
        return '◐';
      case 'unpaid':
        return '○';
      default:
        return '•';
    }
  };

  return (
    <>
      <Head>
        <title>Orders - BGE Credit Management</title>
      </Head>
      <Layout title="Orders">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bge-green text-base"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-auto">
            <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bge-green text-base bg-white"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="card">
            <div className="text-center py-12 text-gray-600">
              <div className="animate-pulse">Loading orders...</div>
            </div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden lg:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Total
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Balance
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => {
                      const customerStatus = getCustomerStatus(order.customerId);
                      return (
                        <tr 
                          key={order._id} 
                          onClick={() => router.push(`/customers/${order.customerId._id}`)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.customerId?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{order.customerId?.phone || ''}</div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              ₦{order.totalAmount?.toLocaleString() || '0'}
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right">
                            <div className={`text-sm font-semibold ${order.customerId?.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₦{order.customerId?.totalDebt?.toLocaleString() || '0'}
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(customerStatus)}`}>
                              <span className="mr-1">{getStatusIcon(customerStatus)}</span>
                              {customerStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => handleDownloadReceipt(order, e)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                              title="Download Statement"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile & Tablet Card View - Hidden on Desktop */}
            <div className="lg:hidden space-y-3">
              {filteredOrders.map((order) => {
                const customerStatus = getCustomerStatus(order.customerId);
                return (
                  <div
                    key={order._id}
                    onClick={() => router.push(`/customers/${order.customerId._id}`)}
                    className="card hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
                  >
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">Order</span>
                          <span className="text-sm font-bold text-gray-900">{order.orderNumber}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <User className="w-4 h-4 mr-1.5 flex-shrink-0" />
                          <span className="font-medium truncate">{order.customerId?.name || 'N/A'}</span>
                        </div>
                        {order.customerId?.phone && (
                          <div className="text-xs text-gray-500 ml-5 mt-0.5">
                            {order.customerId.phone}
                          </div>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ml-2 ${getStatusColor(customerStatus)}`}>
                        <span className="mr-1">{getStatusIcon(customerStatus)}</span>
                        {customerStatus.toUpperCase()}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Date */}
                      <div>
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Date
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Order Amount</div>
                        <div className="text-sm font-bold text-gray-900">
                          ₦{order.totalAmount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>

                    {/* Customer Balance */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1">Customer Total Balance</div>
                      <div className={`text-lg font-bold ${order.customerId?.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₦{order.customerId?.totalDebt?.toLocaleString() || '0'}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => handleDownloadReceipt(order, e)}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Download Statement
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              {statusFilter !== 'all' && ` with ${statusFilter} status`}
            </div>
          </>
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No orders match your filters' 
                  : 'No orders found'}
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}