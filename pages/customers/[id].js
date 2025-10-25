import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { ArrowLeft, Plus, Download, DollarSign } from 'lucide-react';
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
      </Head>
      <Layout>
        {/* Back Button */}
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-bge-green hover:text-bge-light-green mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Customers
        </button>

        {/* Customer Info Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600 mt-1">{customer.phone}</p>
              {customer.email && <p className="text-gray-600">{customer.email}</p>}
              {customer.address && <p className="text-gray-600 mt-2">{customer.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className={`text-3xl font-bold ${customer.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₦{customer.totalDebt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setShowOrderModal(true)}
            className="btn-primary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Order
          </button>
        </div>

        {/* Orders List */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Orders</h3>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Products */}
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Products:</p>
                    <div className="space-y-1">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>{product.name} x {product.quantity}</span>
                          <span>₦{product.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">₦{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold text-green-600">₦{order.amountPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-semibold text-red-600">₦{order.balance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment History */}
                  {order.payments && order.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Payment History:</p>
                      <div className="space-y-1">
                        {order.payments.map((payment, idx) => (
                          <div key={idx} className="text-sm text-gray-600 flex justify-between">
                            <span>{new Date(payment.date).toLocaleDateString()}</span>
                            <span className="text-green-600 font-semibold">₦{payment.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {order.balance > 0 && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPaymentModal(true);
                        }}
                        className="btn-primary text-sm flex items-center"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Make Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadReceipt(order)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No orders yet</p>
          )}
        </div>

        {/* Create Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
              <h3 className="text-xl font-semibold mb-4">Create New Order</h3>
              <form onSubmit={handleCreateOrder}>
                <div className="space-y-4 mb-4">
                  {products.map((product, index) => (
                    <div key={index} className="border border-gray-200 rounded p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="label">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                            className="input-field"
                            placeholder="e.g., Bag of Rice"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Quantity</label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="input-field"
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Unit Price (₦)</label>
                          <input
                            type="number"
                            value={product.unitPrice}
                            onChange={(e) => handleProductChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="input-field"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm text-gray-600">
                          Subtotal: ₦{(product.quantity * product.unitPrice).toLocaleString()}
                        </p>
                        {products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
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
                  className="text-bge-green hover:text-bge-light-green text-sm font-semibold mb-4"
                >
                  + Add Another Product
                </button>

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-bge-green">
                      ₦{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false);
                      setProducts([{ name: '', quantity: 1, unitPrice: 0 }]);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Make Payment Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Record Payment</h3>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Order #{selectedOrder.orderNumber}</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  Balance: ₦{selectedOrder.balance.toLocaleString()}
                </p>
              </div>
              <form onSubmit={handleMakePayment} className="space-y-4">
                <div>
                  <label className="label">Payment Amount (₦)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input-field"
                    min="0.01"
                    max={selectedOrder.balance}
                    step="0.01"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="label">Note (Optional)</label>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="input-field"
                    rows="2"
                    placeholder="Add a note about this payment"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentAmount('');
                      setPaymentNote('');
                      setSelectedOrder(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}