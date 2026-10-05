import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Users,
  BarChart3,
  BookMarked,
  LogOut,
  X,
  Library,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}


export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route transition if currently open
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname, mobileOpen, setMobileOpen]);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  const mainNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/books', label: 'Book Catalog', icon: BookOpen },
  ];

  const adminNavItems = [
    { to: '/members', label: 'Members Directory', icon: Users },
    { to: '/issue', label: 'Issue Book', icon: BookMarked },
    { to: '/returns', label: 'Book Returns', icon: RefreshCw },
  ];

  const personalNavItems = [
    { to: `/members/${user?.id}/history`, label: 'My Borrow History', icon: BookMarked },
  ];

  const renderNavLink = (item: { to: string; label: string; icon: React.ComponentType<{ size: number; className?: string }> }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
            isActive
              ? 'bg-[#f0f0ff] text-[#635bff] shadow-xs'
              : 'text-slate-600 hover:text-[#0a2540] hover:bg-slate-50'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              size={18}
              className={`transition-colors shrink-0 ${
                isActive ? 'text-[#635bff]' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span className="truncate">{item.label}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#635bff]" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#635bff] to-[#00d4b8] flex items-center justify-center text-white shadow-md shadow-[#635bff]/20 group-hover:scale-105 transition-transform shrink-0">
            <Library size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#0a2540]">ShelfLife</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 rounded border border-slate-200">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Library Management</p>
          </div>
        </NavLink>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
        {/* Section: Overview */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            Catalog & Analytics
          </p>
          {mainNavItems.map(renderNavLink)}
        </div>

        {/* Section: Administration (Librarian only) */}
        {isLibrarian && (
          <div className="space-y-1 pt-2">
            <div className="px-3 flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Librarian Operations
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#635bff] bg-[#f0f0ff] px-1.5 py-0.5 rounded">
                <ShieldCheck size={10} />
                Admin
              </span>
            </div>
            {adminNavItems.map(renderNavLink)}
          </div>
        )}

        {/* Section: Personal */}
        <div className="space-y-1 pt-2">
          <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            Personal Loans
          </p>
          {personalNavItems.map(renderNavLink)}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#635bff] to-[#4434d4] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0a2540] truncate leading-tight">{user?.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 capitalize">
                {isLibrarian ? (
                  <span className="text-[#635bff] font-medium flex items-center gap-0.5">
                    <ShieldCheck size={10} /> Librarian
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium flex items-center gap-0.5">
                    <UserCheck size={10} /> Student
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-in with backdrop) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out drawer */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white shadow-2xl z-10 animate-slideRight">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
