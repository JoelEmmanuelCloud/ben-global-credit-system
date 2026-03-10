import Head from 'next/head';

export default function PortalLayout({ children, title = 'Customer Portal' }) {
  return (
    <>
      <Head>
        <title>{title} - BGE</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-bge-green flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">BEN GLOBAL ENTERPRISES</p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Customer Portal</p>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-500">
            <p>18 Bishop Okoye Street, Opp. Mile 3 Market, Diobu, Port Harcourt</p>
            <p className="mt-0.5">Tel: 08068609964</p>
          </div>
        </footer>
      </div>
    </>
  );
}
