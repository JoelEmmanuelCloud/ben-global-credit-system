//pages/customers/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { ArrowLeft, Plus, Download, DollarSign, X } from 'lucide-react';
import Head from 'next/head';
import { downloadReceipt } from '../../lib/pdfGenerator';

export default function CustomerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [products, setProducts] = useState([
    { name: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const calculateTotal = () => {
    return products.reduce((sum, product) => {
      return sum + (product.quantity * product.unitPrice);
    }, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: id,
          products: products.filter(p => p.name && p.quantity > 0 && p.unitPrice > 0),
        }),
      });

      if (res.ok) {
        setShowOrderModal(false);
        setProducts([{ name: '', quantity: 1, unitPrice: 0 }]);
        fetchCustomerDetails();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          note: paymentNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        setSelectedOrder(null);
        fetchCustomerDetails();
        alert('Payment recorded successfully!');
      } else {
        alert(data.message || 'Error processing payment');
      }
    } catch (error) {
      console.error('Error making payment:', error);
      alert('Error processing payment');
    }
  };

  const handleDownloadReceipt = (order) => {
    downloadReceipt(order, customer, 'invoice');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Customer not found</p>
          <button onClick={() => router.push('/customers')} className="btn-primary">
            Back to Customers
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{customer.name} - BGE Credit Management</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <Layout>
        {/* Back Button - Improved mobile touch target */}
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-bge-green hover:text-bge-light-green mb-4 sm:mb-6 p-2 -ml-2 rounded-lg hover:bg-green-50 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Customers</span>
        </button>

        {/* Customer Info Card - Responsive layout */}
        <div className="card mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{customer.name}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{customer.phone}</p>
              {customer.email && <p className="text-gray-600 text-sm sm:text-base break-all">{customer.email}</p>}
              {customer.address && <p className="text-gray-600 mt-2 text-sm sm:text-base">{customer.address}</p>}
            </div>
            <div className="sm:text-right sm:ml-4 p-4 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Outstanding</p>
              <p className={`text-2xl sm:text-3xl font-bold ${customer.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₦{customer.totalDebt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Improved mobile spacing */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setShowOrderModal(true)}
            className="btn-primary w-full sm:w-auto flex items-center justify-center min-h-[48px] text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Order
          </button>
        </div>

        {/* Orders List - Optimized card layout */}
        <div className="card">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Orders</h3>
          {orders.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Order #{order.orderNumber}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold self-start ${
                      order.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Products List - Better mobile display */}
                  <div className="mb-3">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Products:</p>
                    <div className="space-y-1">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="text-xs sm:text-sm text-gray-600 flex flex-wrap justify-between gap-1">
                          <span className="break-words flex-1 min-w-0">
                            {product.name} (x{product.quantity})
                          </span>
                          <span className="font-semibold whitespace-nowrap">
                            ₦{(product.quantity * product.unitPrice).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Info - Stacked on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Total Amount</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        ₦{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Amount Paid</p>
                      <p className="text-sm sm:text-base font-semibold text-green-600">
                        ₦{order.amountPaid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Balance</p>
                      <p className={`text-sm sm:text-base font-semibold ${
                        order.balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₦{order.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  {order.payments && order.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Payment History:</p>
                      <div className="space-y-1">
                        {order.payments.map((payment, idx) => (
                          <div key={idx} className="text-xs sm:text-sm text-gray-600 flex justify-between gap-2">
                            <span className="truncate">{new Date(payment.date).toLocaleDateString()}</span>
                            <span className="text-green-600 font-semibold whitespace-nowrap">
                              ₦{payment.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions - Stacked on mobile, inline on desktop */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {order.balance > 0 && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPaymentModal(true);
                        }}
                        className="btn-primary text-sm flex items-center justify-center min-h-[44px] flex-1 sm:flex-initial"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Make Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadReceipt(order)}
                      className="btn-secondary text-sm flex items-center justify-center min-h-[44px] flex-1 sm:flex-initial"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8 text-sm sm:text-base">No orders yet</p>
          )}
        </div>

        {/* Create Order Modal - Responsive improvements */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Create New Order</h3>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setProducts([{ name: '', quantity: 1, unitPrice: 0 }]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateOrder} className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4 mb-4">
                  {products.map((product, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <label className="label text-sm">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                            className="input-field text-sm w-full"
                            placeholder="e.g., Bag of Rice"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label text-sm">Quantity</label>
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="input-field text-sm w-full"
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Unit Price (₦)</label>
                            <input
                              type="number"
                              value={product.unitPrice}
                              onChange={(e) => handleProductChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="input-field text-sm w-full"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          Subtotal: <span className="text-bge-green">₦{(product.quantity * product.unitPrice).toLocaleString()}</span>
                        </p>
                        {products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="text-bge-green hover:text-bge-light-green text-sm font-semibold mb-4 px-3 py-2 hover:bg-green-50 rounded transition-colors w-full sm:w-auto"
                >
                  + Add Another Product
                </button>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-base sm:text-lg font-semibold">Total Amount:</span>
                    <span className="text-xl sm:text-2xl font-bold text-bge-green">
                      ₦{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false);
                      setProducts([{ name: '', quantity: 1, unitPrice: 0 }]);
                    }}
                    className="btn-secondary w-full sm:w-auto min-h-[48px]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary w-full sm:w-auto min-h-[48px]">
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Make Payment Modal - Responsive improvements */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Record Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentNote('');
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 mt-2">
                    Balance: ₦{selectedOrder.balance.toLocaleString()}
                  </p>
                </div>
                
                <form onSubmit={handleMakePayment} className="space-y-4">
                  <div>
                    <label className="label text-sm">Payment Amount (₦)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input-field text-sm w-full"
                      min="0.01"
                      max={selectedOrder.balance}
                      step="0.01"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm">Note (Optional)</label>
                    <textarea
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="input-field text-sm w-full"
                      rows="3"
                      placeholder="Add a note about this payment"
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentAmount('');
                        setPaymentNote('');
                        setSelectedOrder(null);
                      }}
                      className="btn-secondary w-full sm:w-auto min-h-[48px]"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary w-full sm:w-auto min-h-[48px]">
                      Record Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}