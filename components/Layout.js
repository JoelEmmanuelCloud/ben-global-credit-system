//components/Layout.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Users, ShoppingCart, BarChart3, LogOut, Menu, X, Warehouse, Receipt } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children, title }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Warehouse', href: '/warehouse', icon: Warehouse },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-bge-green">BGE</h1>
              <span className="ml-3 text-gray-600 hidden sm:block">Credit Management</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-bge-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-700"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-bge-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p className="font-semibold">BEN GLOBAL ENTERPRISES (BGE)</p>
            <p>18 Bishop Okoye Street, Opp. Mile 3 Market, Diobu, Port Harcourt</p>
            <p>Tel: 08068609964</p>
          </div>
        </div>
      </footer>
    </div>
  );
}