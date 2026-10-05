import React, { useState, useCallback } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Loader2, Menu, Library } from 'lucide-react';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSetMobileOpen = useCallback((open: boolean) => {
    setMobileOpen((prev) => (prev === open ? prev : open));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="text-[#635bff] spin" />
        <p className="text-sm font-medium text-slate-500">Loading ShelfLife...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Derive current page title for top mobile bar
  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/books')) return 'Book Catalog';
    if (pathname.startsWith('/members/') && pathname.endsWith('/history')) return 'Borrow History';
    if (pathname.startsWith('/members')) return 'Members Directory';
    if (pathname.startsWith('/issue')) return 'Issue Book';
    if (pathname.startsWith('/returns')) return 'Book Returns';
    return 'ShelfLife';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-[#0a2540]">
      {/* Sidebar (Desktop permanent + Mobile slide-out drawer) */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={handleSetMobileOpen}
      />

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-64 xl:pl-72 transition-all">
        {/* Mobile Top Header (< lg screens) */}
        <header className="lg:hidden sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-16 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSetMobileOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#635bff] to-[#00d4b8] flex items-center justify-center text-white shadow-xs">
                <Library size={16} className="stroke-[2.2]" />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#0a2540]">
                {getPageTitle(location.pathname)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#635bff] to-[#4434d4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content with optimal max-width */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


export default ProtectedLayout;


