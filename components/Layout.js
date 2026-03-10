import { useRouter } from 'next/router';
import Link from 'next/link';
import { Users, ShoppingCart, BarChart3, LogOut, Menu, X, Warehouse, Receipt, ChevronRight } from 'lucide-react';
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bge-green flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-none">BGE</h1>
                <span className="text-xs text-gray-500 hidden sm:block leading-none">Credit Management</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-bge-green text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                title="Logout"
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-bge-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        {children}
      </main>

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