import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Receipt, DollarSign, FileText, Edit, Trash2, X, Download } from 'lucide-react';
import Head from 'next/head';
import { downloadExpenseReport } from '../lib/pdfGenerator';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Filter states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'operating',
    description: '',
    paymentMethod: 'cash',
    receiptNumber: '',
    vendorName: '',
    vendorContact: '',
    vatAmount: '',
    isTaxDeductible: false,
  });

  const categories = [
    { value: 'all', label: 'All Categories', color: 'gray' },
    { value: 'operating', label: 'Operating Expenses', color: 'blue' },
    { value: 'inventory', label: 'Inventory/Purchase', color: 'purple' },
    { value: 'tax', label: 'Tax Payments', color: 'red' },
    { value: 'labour_transport', label: 'Labour & Transport', color: 'green' },
    { value: 'other', label: 'Other', color: 'gray' },
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, categoryFilter, expenses]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exp =>
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.vendorName && exp.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(exp => exp.category === categoryFilter);
    }

    // Date range filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(exp => new Date(exp.date) >= new Date(dateFilter.startDate));
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(exp => new Date(exp.date) <= new Date(dateFilter.endDate));
    }

    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString().replace(/,/g, '')) || 0,
          vatAmount: parseFloat(formData.vatAmount.toString().replace(/,/g, '')) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchExpenses();
        alert('Expense added successfully!');
      } else {
        alert(data.message || 'Error adding expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/expenses/${selectedExpense._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount.toString().replace(/,/g, '')) || 0,
          vatAmount: parseFloat(formData.vatAmount.toString().replace(/,/g, '')) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        resetForm();
        fetchExpenses();
        alert('Expense updated successfully!');
      } else {
        alert(data.message || 'Error updating expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/expenses/${expenseId}`, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (res.ok) {
          fetchExpenses();
          alert('Expense deleted successfully!');
        } else {
          alert(data.message || 'Error deleting expense');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense');
      }
    }
  };

  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      receiptNumber: expense.receiptNumber || '',
      vendorName: expense.vendorName || '',
      vendorContact: expense.vendorContact || '',
      vatAmount: expense.vatAmount ? expense.vatAmount.toString() : '',
      isTaxDeductible: expense.isTaxDeductible || false,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: 'operating',
      description: '',
      paymentMethod: 'cash',
      receiptNumber: '',
      vendorName: '',
      vendorContact: '',
      vatAmount: '',
      isTaxDeductible: false,
    });
    setSelectedExpense(null);
  };

  const handleExportPDF = () => {
    downloadExpenseReport(filteredExpenses, dateFilter);
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  const getCategoryLabel = (categoryValue) => {
    const cat = categories.find(c => c.value === categoryValue);
    return cat ? cat.label : categoryValue;
  };

  const getCategoryColor = (categoryValue) => {
    const cat = categories.find(c => c.value === categoryValue);
    const color = cat ? cat.color : 'gray';
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colorMap[color] || colorMap.gray;
  };

  // Calculate summaries
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });
  const totalMonthExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const operatingExpenses = expenses.filter(e => e.category === 'operating').reduce((sum, exp) => sum + exp.amount, 0);
  const inventoryExpenses = expenses.filter(e => e.category === 'inventory').reduce((sum, exp) => sum + exp.amount, 0);
  const taxDeductibleAmount = expenses.filter(e => e.isTaxDeductible).reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      <Head>
        <title>Expenses - BGE Credit Management</title>
      </Head>
      <Layout title="Financial Expenses">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total (This Month)</p>
                <p className="text-2xl font-bold text-blue-700">N{totalMonthExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="card bg-purple-50 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operating Expenses</p>
                <p className="text-2xl font-bold text-purple-700">N{operatingExpenses.toLocaleString()}</p>
              </div>
              <Receipt className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="card bg-green-50 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Costs</p>
                <p className="text-2xl font-bold text-green-700">N{inventoryExpenses.toLocaleString()}</p>
              </div>
              <FileText className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="card bg-orange-50 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tax Deductible</p>
                <p className="text-2xl font-bold text-orange-700">N{taxDeductibleAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by description, vendor, or receipt..."
                  className="input-field pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                className="input-field"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                placeholder="Start Date"
              />
              <input
                type="date"
                className="input-field"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                placeholder="End Date"
              />
            </div>

            {/* Category Filter */}
            <select
              className="input-field"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              disabled={filteredExpenses.length === 0}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>

            {/* Add Expense Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="card text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Expenses Found</h3>
            <p className="text-gray-500 mb-4">Start by adding your first expense record</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vendor</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">VAT</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(expense.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        {expense.receiptNumber && (
                          <div className="text-xs text-gray-500">Receipt: {expense.receiptNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(expense.category)}`}>
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {expense.vendorName || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        N{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {expense.vatAmount ? `N${expense.vatAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredExpenses.map((expense) => (
                <div key={expense._id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                      <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(expense.category)}`}>
                        {getCategoryLabel(expense.category)}
                      </span>
                    </div>
                    {expense.vendorName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vendor:</span>
                        <span className="font-medium">{expense.vendorName}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-gray-900">N{expense.amount.toLocaleString()}</span>
                    </div>
                    {expense.vatAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">VAT:</span>
                        <span className="font-medium">N{expense.vatAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {expense.receiptNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Receipt:</span>
                        <span className="font-medium">{expense.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6">
                {/* Basic Info Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="input-field"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        {categories.filter(c => c.value !== 'all').map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (N) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formatCurrency(formData.amount)}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/,/g, '') })}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VAT Amount (N)
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formatCurrency(formData.vatAmount)}
                        onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value.replace(/,/g, '') })}
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="input-field"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the expense..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="input-field"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        required
                      >
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt/Invoice Number
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.receiptNumber}
                        onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                        placeholder="Enter receipt number"
                      />
                    </div>
                  </div>
                </div>

                {/* Vendor Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        placeholder="Vendor or payee name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Contact
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.vendorContact}
                        onChange={(e) => setFormData({ ...formData, vendorContact: e.target.value })}
                        placeholder="Phone or email"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="taxDeductible"
                      className="w-4 h-4 text-bge-green border-gray-300 rounded focus:ring-bge-green"
                      checked={formData.isTaxDeductible}
                      onChange={(e) => setFormData({ ...formData, isTaxDeductible: e.target.checked })}
                    />
                    <label htmlFor="taxDeductible" className="ml-2 text-sm text-gray-700">
                      This expense is tax deductible
                    </label>
                  </div>
                </div>

                {/* Summary */}
                {(formData.amount || formData.vatAmount) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                      <span className="text-lg font-bold text-gray-900">
                        N{(
                          (parseFloat(formData.amount.toString().replace(/,/g, '')) || 0) +
                          (parseFloat(formData.vatAmount.toString().replace(/,/g, '')) || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {showEditModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Edit Expense</h2>
                <button
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditExpense} className="p-6">
                {/* Basic Info Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="input-field"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        {categories.filter(c => c.value !== 'all').map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (N) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formatCurrency(formData.amount)}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value.replace(/,/g, '') })}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VAT Amount (N)
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formatCurrency(formData.vatAmount)}
                        onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value.replace(/,/g, '') })}
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="input-field"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the expense..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="input-field"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        required
                      >
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt/Invoice Number
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.receiptNumber}
                        onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                        placeholder="Enter receipt number"
                      />
                    </div>
                  </div>
                </div>

                {/* Vendor Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        placeholder="Vendor or payee name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Contact
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.vendorContact}
                        onChange={(e) => setFormData({ ...formData, vendorContact: e.target.value })}
                        placeholder="Phone or email"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="taxDeductibleEdit"
                      className="w-4 h-4 text-bge-green border-gray-300 rounded focus:ring-bge-green"
                      checked={formData.isTaxDeductible}
                      onChange={(e) => setFormData({ ...formData, isTaxDeductible: e.target.checked })}
                    />
                    <label htmlFor="taxDeductibleEdit" className="ml-2 text-sm text-gray-700">
                      This expense is tax deductible
                    </label>
                  </div>
                </div>

                {/* Summary */}
                {(formData.amount || formData.vatAmount) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                      <span className="text-lg font-bold text-gray-900">
                        N{(
                          (parseFloat(formData.amount.toString().replace(/,/g, '')) || 0) +
                          (parseFloat(formData.vatAmount.toString().replace(/,/g, '')) || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Expense
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
