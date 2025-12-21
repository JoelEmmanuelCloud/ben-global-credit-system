//pages/customers/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { ArrowLeft, Plus, Download, DollarSign, X, Calendar, Package, CreditCard, Edit, Trash2, Search } from 'lucide-react';
import Head from 'next/head';
import { downloadCustomerReceipt } from '../../lib/pdfGenerator';

export default function CustomerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product inventory states
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  
  // Form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [products, setProducts] = useState([
    { name: '', quantity: '', unitPrice: '', productId: null, availableStock: null, unit: '' }
  ]);
  
  // Edit states
  const [editingCustomer, setEditingCustomer] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
      fetchInventoryProducts();
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

  const fetchInventoryProducts = async () => {
    try {
      const res = await fetch('/api/Product?active=true');
      const data = await res.json();
      if (data.success) {
        setAllProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Product search and selection
  const handleProductSearch = (searchValue, productIndex) => {
    setProductSearchTerm(searchValue);

    if (searchValue.length > 0) {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchValue.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setShowProductDropdown(true);
    } else {
      setShowProductDropdown(false);
    }

    // Update the product name
    const newProducts = [...products];
    newProducts[productIndex].name = searchValue;
    setProducts(newProducts);
  };

  const handleSelectProduct = (product, productIndex) => {
    const newProducts = [...products];
    newProducts[productIndex] = {
      name: product.name,
      quantity: newProducts[productIndex].quantity || '',
      unitPrice: product.unitPrice.toString(),
      productId: product._id,
      availableStock: product.currentStock,
      unit: product.unit,
    };
    setProducts(newProducts);
    setShowProductDropdown(false);
    setProductSearchTerm('');
  };

  // Customer edit/delete functions
  const handleEditCustomer = () => {
    setEditingCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      oldBalance: customer.oldBalance || 0
    });
    setShowEditCustomerModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/customers/${id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomer)
      });

      if (res.ok) {
        setShowEditCustomerModal(false);
        fetchCustomerDetails();
        alert('Customer updated successfully!');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer');
    }
  };

  // Order edit/delete functions
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setProducts(order.products.map(p => ({
      name: p.name,
      quantity: p.quantity.toString(),
      unitPrice: p.unitPrice.toString()
    })));
    setShowEditOrderModal(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    
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
      const res = await fetch(`/api/orders/${editingOrder._id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: validProducts })
      });

      if (res.ok) {
        setShowEditOrderModal(false);
        setProducts([{ name: '', quantity: '', unitPrice: '', productId: null, availableStock: null, unit: '' }]);
        fetchCustomerDetails();
        alert('Order updated successfully!');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          fetchCustomerDetails();
          alert('Order deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
      }
    }
  };

  // Payment edit/delete functions
  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentAmount(payment.amount.toString());
    setPaymentNote(payment.note || '');
    setShowEditPaymentModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount.toString().replace(/,/g, ''));

    try {
      const res = await fetch(`/api/customers/${id}/payment/${editingPayment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, note: paymentNote })
      });

      if (res.ok) {
        setShowEditPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        fetchCustomerDetails();
        alert('Payment updated successfully!');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      try {
        const res = await fetch(`/api/customers/${id}/payment/${paymentId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          fetchCustomerDetails();
          alert('Payment deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment');
      }
    }
  };

  const handleAddProduct = () => {
    setProducts([...products, { name: '', quantity: '', unitPrice: '', productId: null, availableStock: null, unit: '' }]);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];

    if (field === 'unitPrice') {
      const numericValue = value.replace(/,/g, '');
      newProducts[index][field] = numericValue;
    } else if (field === 'quantity') {
      newProducts[index][field] = value;

      // Check stock availability
      if (newProducts[index].availableStock != null) {
        const requestedQty = parseFloat(value) || 0;
        if (requestedQty > newProducts[index].availableStock) {
          alert(`Only ${newProducts[index].availableStock.toLocaleString()} ${newProducts[index].unit} available in stock!`);
        }
      }
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

    // Check stock for inventory products
    for (const product of products.filter(p => p.productId)) {
      const requestedQty = parseFloat(product.quantity) || 0;
      if (requestedQty > product.availableStock) {
        alert(`Insufficient stock for ${product.name}. Available: ${product.availableStock.toLocaleString()} ${product.unit}`);
        return;
      }
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

      const data = await res.json();

      if (res.ok) {
        setShowOrderModal(false);
        setProducts([{ name: '', quantity: '', unitPrice: '', productId: null, availableStock: null, unit: '' }]);
        fetchCustomerDetails();
        alert('Order created successfully!');
      } else {
        alert(data.message || 'Error creating order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    }
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();

    const amount = parseFloat(paymentAmount.toString().replace(/,/g, ''));

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
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words flex-1">{customer.name}</h2>
                <button
                  onClick={handleEditCustomer}
                  className="ml-2 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Customer"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
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
        <div className={`grid ${hasOldBalance ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-3 sm:gap-4 mb-4 sm:mb-6`}>
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

          <div className="card bg-purple-50 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">Wallet</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600">
                  ₦{(customer.wallet || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
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
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center min-h-[48px] text-base flex-1 sm:flex-initial"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Record Payment
          </button>
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
                    <div className="flex-1">
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
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-lg sm:text-xl font-bold text-gray-900">
                          ₦{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="bg-white rounded p-2 sm:p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Products:</p>
                    <div className="space-y-1">
                      {order.products.map((product, idx) => (
                        <div key={idx} className="text-xs sm:text-sm text-gray-600 flex justify-between gap-2">
                          <span className="break-words flex-1">
                            {product.name} (x{product.quantity.toLocaleString()} @ ₦{product.unitPrice.toLocaleString()})
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
                <div key={payment._id || idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
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
                    <div className="flex items-center gap-2">
                      <p className="text-lg sm:text-xl font-bold text-green-600 mr-2">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Payment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment._id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODALS - Create Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Create New Order</h3>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setProducts([{ name: '', quantity: '', unitPrice: '', productId: null, availableStock: null, unit: '' }]);
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
                        {/* Product Name with Search */}
                        <div className="relative">
                          <label className="label text-sm">
                            Product Name *
                            {product.availableStock != null && (
                              <span className="ml-2 text-xs text-green-600">
                                ({product.availableStock.toLocaleString()} {product.unit} available)
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => handleProductSearch(e.target.value, index)}
                              onFocus={() => {
                                if (filteredProducts.length > 0) setShowProductDropdown(true);
                              }}
                              className="input-field text-sm w-full pr-10"
                              placeholder="Search or type product name"
                              required
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>

                          {/* Product Dropdown */}
                          {showProductDropdown && filteredProducts.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredProducts.map((prod) => (
                                <button
                                  key={prod._id}
                                  type="button"
                                  onClick={() => handleSelectProduct(prod, index)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">{prod.name}</p>
                                      {prod.category && (
                                        <p className="text-xs text-gray-500">{prod.category}</p>
                                      )}
                                    </div>
                                    <div className="text-right ml-3">
                                      <p className="text-sm font-semibold text-bge-green">
                                        ₦{prod.unitPrice.toLocaleString()}
                                      </p>
                                      <p className={`text-xs ${prod.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {prod.currentStock.toLocaleString()} {prod.unit}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label text-sm">Quantity *</label>
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="input-field text-sm w-full"
                              min="1"
                              step="0.01"
                              placeholder="0"
                              required
                            />
                            {product.availableStock != null && parseFloat(product.quantity) > product.availableStock && (
                              <p className="text-xs text-red-600 mt-1">
                                Exceeds available stock!
                              </p>
                            )}
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

        {/* Edit Customer Modal */}
        {showEditCustomerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Edit Customer</h3>
                <button
                  onClick={() => setShowEditCustomerModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveCustomer} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    className="input-field text-base"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    className="input-field text-base"
                    required
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                    className="input-field text-base"
                  />
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                    className="input-field text-base"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="label">Old Balance (₦)</label>
                  <input
                    type="text"
                    value={editingCustomer.oldBalance ? parseFloat(editingCustomer.oldBalance.toString().replace(/,/g, '')).toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      setEditingCustomer({...editingCustomer, oldBalance: value});
                    }}
                    className="input-field text-base"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Existing debt before adding to system
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditCustomerModal(false)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary w-full sm:w-auto">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Order Modal - Similar structure to create */}
        {showEditOrderModal && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Edit Order #{editingOrder.orderNumber}</h3>
                <button
                  onClick={() => {
                    setShowEditOrderModal(false);
                    setProducts([{ name: '', quantity: '', unitPrice: '' }]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveOrder} className="p-4 sm:p-6">
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
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditOrderModal(false);
                      setProducts([{ name: '', quantity: '', unitPrice: '' }]);
                    }}
                    className="btn-secondary w-full sm:w-auto min-h-[48px]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary w-full sm:w-auto min-h-[48px]">
                    Save Changes
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
                      type="text"
                      value={paymentAmount ? parseFloat(paymentAmount.toString().replace(/,/g, '')).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (value === '' || !isNaN(value)) {
                          setPaymentAmount(value);
                        }
                      }}
                      className="input-field text-sm w-full"
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current debt: ₦{customer.totalDebt.toLocaleString()}. Any excess will be added to wallet.
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

        {/* Edit Payment Modal */}
        {showEditPaymentModal && editingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">Edit Payment</h3>
                <button
                  onClick={() => {
                    setShowEditPaymentModal(false);
                    setPaymentAmount('');
                    setPaymentNote('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div>
                    <label className="label text-sm">Payment Amount (₦) *</label>
                    <input
                      type="text"
                      value={paymentAmount ? parseFloat(paymentAmount.toString().replace(/,/g, '')).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (value === '' || !isNaN(value)) {
                          setPaymentAmount(value);
                        }
                      }}
                      className="input-field text-sm w-full"
                      placeholder="0"
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
                        setShowEditPaymentModal(false);
                        setPaymentAmount('');
                        setPaymentNote('');
                      }}
                      className="btn-secondary w-full sm:w-auto min-h-[48px]"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary w-full sm:w-auto min-h-[48px]">
                      Save Changes
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