//pages/customers/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { ArrowLeft, Plus, Download, DollarSign, X, Calendar, Package, CreditCard } from 'lucide-react';
import Head from 'next/head';
import { downloadCustomerReceipt } from '../../lib/pdfGenerator';

export default function CustomerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [products, setProducts] = useState([
    { name: '', quantity: '', unitPrice: '' }
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
        console.log('Customer data:', data.customer); // Debug log
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: '', quantity: '', unitPrice: '' }]);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    
    if (field === 'unitPrice') {
      // Remove commas and parse as number
      const numericValue = value.replace(/,/g, '');
      newProducts[index][field] = numericValue;
    } else if (field === 'quantity') {
      newProducts[index][field] = value;
    } else {
      newProducts[index][field] = value;
    }
    
    setProducts(newProducts);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const calculateTotal = () => {
    return products.reduce((sum, product) => {
      const qty = parseFloat(product.quantity) || 0;
      const price = parseFloat(product.unitPrice.toString().replace(/,/g, '')) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    // Validate and prepare products
    const validProducts = products
      .filter(p => p.name && p.quantity && p.unitPrice)
      .map(p => ({
        name: p.name,
        quantity: parseFloat(p.quantity),
        unitPrice: parseFloat(p.unitPrice.toString().replace(/,/g, ''))
      }));

    if (validProducts.length === 0) {
      alert('Please add at least one valid product');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: id,
          products: validProducts,
        }),
      });

      if (res.ok) {
        setShowOrderModal(false);
        setProducts([{ name: '', quantity: '', unitPrice: '' }]);
        fetchCustomerDetails();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();

    const amount = parseFloat(paymentAmount);
    
    if (amount > customer.totalDebt) {
      alert(`Payment amount (₦${amount.toLocaleString()}) cannot exceed total debt (₦${customer.totalDebt.toLocaleString()})`);
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          note: paymentNote,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');
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

  const handleDownloadStatement = () => {
    downloadCustomerReceipt(customer, orders);
  };

  const getTotalOrders = () => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  };

  const getTotalPaid = () => {
    if (!customer.payments) return 0;
    return customer.payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getOldBalance = () => {
    if (!customer.oldBalance) return 0;
    return parseFloat(customer.oldBalance) || 0;
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

  const oldBalance = getOldBalance();
  const hasOldBalance = oldBalance > 0;

  return (
    <>
      <Head>
        <title>{customer.name} - BGE Credit Management</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <Layout>
        {/* Back Button */}
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-bge-green hover:text-bge-light-green mb-4 sm:mb-6 p-2 -ml-2 rounded-lg hover:bg-green-50 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back to Customers</span>
        </button>

        {/* Customer Info Card */}
        <div className="card mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{customer.name}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{customer.phone}</p>
              {customer.email && <p className="text-gray-600 text-sm sm:text-base break-all">{customer.email}</p>}
              {customer.address && <p className="text-gray-600 mt-2 text-sm sm:text-base">{customer.address}</p>}
            </div>
            <div className="sm:text-right sm:ml-4 p-4 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Balance</p>
              <p className={`text-2xl sm:text-3xl font-bold ${customer.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₦{customer.totalDebt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className={`grid ${hasOldBalance ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-3 sm:gap-4 mb-4 sm:mb-6`}>
          {hasOldBalance && (
            <div className="card bg-orange-50 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Old Balance</p>
                  <p className="text-lg sm:text-xl font-bold text-orange-600">
                    ₦{oldBalance.toLocaleString()}
                  </p>
                </div>
                <Package className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          )}

          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  ₦{getTotalOrders().toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="card bg-green-50 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  ₦{getTotalPaid().toLocaleString()}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="card bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">Balance</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">
                  ₦{customer.totalDebt.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setShowOrderModal(true)}
            className="btn-primary flex items-center justify-center min-h-[48px] text-base flex-1 sm:flex-initial"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Order
          </button>
          {customer.totalDebt > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center min-h-[48px] text-base flex-1 sm:flex-initial"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Record Payment
            </button>
          )}
          <button
            onClick={handleDownloadStatement}
            className="btn-secondary flex items-center justify-center min-h-[48px] text-base flex-1 sm:flex-initial"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Statement
          </button>
        </div>

        {/* Orders List */}
        <div className="card mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-bge-green" />
            Orders ({orders.length})
          </h3>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-gray-50">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Order #{order.orderNumber}</p>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        ₦{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="bg-white rounded p-2 sm:p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Products:</p>
                    <div className="space-y-1">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="text-xs sm:text-sm text-gray-600 flex justify-between gap-2">
                          <span className="break-words flex-1">
                            {product.name} (x{product.quantity})
                          </span>
                          <span className="font-semibold whitespace-nowrap">
                            ₦{product.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8 text-sm sm:text-base">No orders yet</p>
          )}
        </div>

        {/* Payment History */}
        {customer.payments && customer.payments.length > 0 && (
          <div className="card">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-bge-green" />
              Payment History ({customer.payments.length})
            </h3>
            <div className="space-y-3">
              {customer.payments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((payment, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(payment.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      {payment.note && (
                        <p className="text-xs text-gray-500 mt-1">{payment.note}</p>
                      )}
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-600">
                      ₦{payment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Create New Order</h3>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setProducts([{ name: '', quantity: '', unitPrice: '' }]);
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
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="input-field text-sm w-full"
                              min="1"
                              placeholder="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Unit Price (₦)</label>
                            <input
                              type="text"
                              value={formatCurrency(product.unitPrice)}
                              onChange={(e) => handleProductChange(index, 'unitPrice', e.target.value.replace(/,/g, ''))}
                              className="input-field text-sm w-full"
                              placeholder="0"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          Subtotal: <span className="text-bge-green">
                            ₦{((parseFloat(product.quantity) || 0) * (parseFloat(product.unitPrice.toString().replace(/,/g, '')) || 0)).toLocaleString()}
                          </span>
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
                    <span className="text-base sm:text-lg font-semibold">Order Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-bge-green">
                      ₦{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This will be added to customer's total debt
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false);
                      setProducts([{ name: '', quantity: '', unitPrice: '' }]);
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

        {/* Make Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Record Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentNote('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Total Outstanding Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    ₦{customer.totalDebt.toLocaleString()}
                  </p>
                </div>
                
                <form onSubmit={handleMakePayment} className="space-y-4">
                  <div>
                    <label className="label text-sm">Payment Amount (₦) *</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input-field text-sm w-full"
                      min="0.01"
                      max={customer.totalDebt}
                      step="0.01"
                      placeholder="Enter amount"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ₦{customer.totalDebt.toLocaleString()}
                    </p>
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