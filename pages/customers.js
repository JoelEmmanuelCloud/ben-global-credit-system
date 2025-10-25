//page/customers.js
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Search, Trash2, Phone, Mail, MapPin, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setFilteredCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', phone: '', email: '', address: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customer? All their orders will also be deleted.')) {
      try {
        const res = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          fetchCustomers();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Customers - BGE Credit Management</title>
      </Head>
      <Layout title="Customers">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bge-green text-base"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center py-2.5 px-4 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Customer
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="card">
            <div className="text-center py-12 text-gray-600">Loading...</div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Debt
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr 
                        key={customer._id} 
                        onClick={() => router.push(`/customers/${customer._id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{customer.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${customer.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₦{customer.totalDebt.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => handleDelete(customer._id, e)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            aria-label="Delete customer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View - Hidden on Desktop */}
            <div className="md:hidden space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => router.push(`/customers/${customer._id}`)}
                  className="card hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">
                        {customer.name}
                      </h3>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                        
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        
                        {customer.address && (
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{customer.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-500 block mb-0.5">Total Debt</span>
                          <span className={`text-lg font-bold ${customer.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₦{customer.totalDebt.toLocaleString()}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => handleDelete(customer._id, e)}
                          className="text-red-600 hover:text-red-800 p-2 -mr-2 transition-colors"
                          aria-label="Delete customer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No customers match your search' : 'No customers found'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Add Your First Customer
              </button>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-8">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Add New Customer</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field text-base"
                    />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input-field text-base"
                      rows="3"
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary w-full sm:w-auto">
                      Add Customer
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