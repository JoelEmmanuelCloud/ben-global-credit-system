//page/warehouse.js
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, X, TrendingUp, TrendingDown, History } from 'lucide-react';
import Head from 'next/head';

export default function Warehouse() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    unit: 'bags',
    currentStock: '',
    unitPrice: '',
    lowStockThreshold: '10',
    description: '',
    category: '',
  });

  const [stockData, setStockData] = useState({
    type: 'addition',
    quantity: '',
    reason: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/Product');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/Product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentStock: parseFloat(formData.currentStock) || 0,
          unitPrice: parseFloat(formData.unitPrice.toString().replace(/,/g, '')) || 0,
          lowStockThreshold: parseFloat(formData.lowStockThreshold) || 10,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchProducts();
        alert('Product added successfully!');
      } else {
        alert(data.message || 'Error adding product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/Product/${selectedProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          unitPrice: parseFloat(formData.unitPrice.toString().replace(/,/g, '')) || 0,
          lowStockThreshold: parseFloat(formData.lowStockThreshold) || 10,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        resetForm();
        fetchProducts();
        alert('Product updated successfully!');
      } else {
        alert(data.message || 'Error updating product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/Product/${selectedProduct._id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: stockData.type,
          quantity: parseFloat(stockData.quantity),
          reason: stockData.reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowStockModal(false);
        setStockData({ type: 'addition', quantity: '', reason: '' });
        fetchProducts();
        alert('Stock updated successfully!');
      } else {
        alert(data.message || 'Error updating stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/Product/${productId}`, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (res.ok) {
          fetchProducts();
          alert('Product deleted successfully!');
        } else {
          alert(data.message || 'Error deleting product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit,
      currentStock: product.currentStock.toString(),
      unitPrice: product.unitPrice.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      description: product.description || '',
      category: product.category || '',
    });
    setShowEditModal(true);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockData({ type: 'addition', quantity: '', reason: '' });
    setShowStockModal(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'bags',
      currentStock: '',
      unitPrice: '',
      lowStockThreshold: '10',
      description: '',
      category: '',
    });
    setSelectedProduct(null);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return 'out';
    if (product.currentStock <= product.lowStockThreshold) return 'low';
    return 'good';
  };

  const getStockColor = (status) => {
    switch (status) {
      case 'out':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);

  return (
    <>
      <Head>
        <title>Warehouse - BGE Credit Management</title>
      </Head>
      <Layout title="Warehouse & Inventory">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{products.length}</p>
              </div>
              <Package className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          <div className="card bg-yellow-50 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-yellow-400" />
            </div>
          </div>

          <div className="card bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </div>

          <div className="card bg-green-50 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-xl font-bold text-green-600">₦{totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bge-green"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center justify-center min-h-[44px]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-pulse text-gray-600">Loading products...</div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden lg:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product);
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500">{product.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.category || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {product.currentStock.toLocaleString()} {product.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                            ₦{product.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStockColor(status)}`}>
                              {status === 'out' && 'OUT OF STOCK'}
                              {status === 'low' && 'LOW STOCK'}
                              {status === 'good' && 'IN STOCK'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openStockModal(product)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                title="Update Stock"
                              >
                                <TrendingUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openHistoryModal(product)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Stock History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(product)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-3">
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                return (
                  <div key={product._id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.category && (
                          <p className="text-xs text-gray-500">{product.category}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ml-2 ${getStockColor(status)}`}>
                        {status === 'out' && 'OUT'}
                        {status === 'low' && 'LOW'}
                        {status === 'good' && 'OK'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Current Stock</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {product.currentStock.toLocaleString()} {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Unit Price</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₦{product.unitPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t">
                      <button
                        onClick={() => openStockModal(product)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                      >
                        <TrendingUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openHistoryModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <History className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              {searchTerm ? 'No products match your search' : 'No products in warehouse'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary mt-4"
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Add Your First Product
              </button>
            )}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h3 className="text-xl font-semibold">Add New Product</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Golden Penny Flour"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="bags">Bags</option>
                      <option value="cartons">Cartons</option>
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="liters">Liters</option>
                      <option value="units">Units</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Initial Stock *</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.currentStock)}
                      onChange={(e) => setFormData({ ...formData, currentStock: e.target.value.replace(/,/g, '') })}
                      className="input-field"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Unit Price (₦) *</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.unitPrice)}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value.replace(/,/g, '') })}
                      className="input-field"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Low Stock Alert</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.lowStockThreshold)}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value.replace(/,/g, '') })}
                      className="input-field"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Grains, Beverages"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Additional details about the product"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal - Similar to Add but with edit logic */}
        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h3 className="text-xl font-semibold">Edit Product</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditProduct} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="bags">Bags</option>
                      <option value="cartons">Cartons</option>
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="liters">Liters</option>
                      <option value="units">Units</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Current Stock:</strong> {selectedProduct.currentStock.toLocaleString()} {selectedProduct.unit}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Use the "Update Stock" button to add or remove stock
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Unit Price (₦) *</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.unitPrice)}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value.replace(/,/g, '') })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Low Stock Alert</label>
                    <input
                      type="text"
                      value={formatCurrency(formData.lowStockThreshold)}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value.replace(/,/g, '') })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Stock Modal */}
        {showStockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-semibold">Update Stock</h3>
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setStockData({ type: 'addition', quantity: '', reason: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600 mt-2">Current Stock</p>
                  <p className="text-2xl font-bold text-bge-green">
                    {selectedProduct.currentStock.toLocaleString()} {selectedProduct.unit}
                  </p>
                </div>

                <form onSubmit={handleUpdateStock} className="space-y-4">
                  <div>
                    <label className="label">Action *</label>
                    <select
                      value={stockData.type}
                      onChange={(e) => setStockData({ ...stockData, type: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="addition">Add Stock</option>
                      <option value="deduction">Remove Stock</option>
                      <option value="adjustment">Set Stock Level</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      {stockData.type === 'adjustment' ? 'New Stock Level *' : 'Quantity *'}
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(stockData.quantity)}
                      onChange={(e) => setStockData({ ...stockData, quantity: e.target.value.replace(/,/g, '') })}
                      className="input-field"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Reason</label>
                    <textarea
                      value={stockData.reason}
                      onChange={(e) => setStockData({ ...stockData, reason: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Optional note about this stock change"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStockModal(false);
                        setStockData({ type: 'addition', quantity: '', reason: '' });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Update Stock
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stock History Modal */}
        {showHistoryModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h3 className="text-xl font-semibold">Stock History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600 mt-2">Current Stock</p>
                  <p className="text-2xl font-bold text-bge-green">
                    {selectedProduct.currentStock.toLocaleString()} {selectedProduct.unit}
                  </p>
                </div>

                {selectedProduct.stockHistory && selectedProduct.stockHistory.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProduct.stockHistory
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((history, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {history.type === 'addition' && (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                              )}
                              {history.type === 'deduction' && (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              )}
                              {history.type === 'adjustment' && (
                                <Edit className="w-5 h-5 text-blue-600" />
                              )}
                              <span className="font-semibold text-gray-900 capitalize">
                                {history.type}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(history.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Previous</p>
                              <p className="font-semibold">{history.previousStock.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Change</p>
                              <p className={`font-semibold ${history.type === 'addition' ? 'text-green-600' : 'text-red-600'}`}>
                                {history.type === 'addition' ? '+' : '-'}{history.quantity.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">New</p>
                              <p className="font-semibold">{history.newStock.toLocaleString()}</p>
                            </div>
                          </div>

                          {history.reason && (
                            <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
                              {history.reason}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No stock history yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}