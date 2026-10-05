import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { Loader2 } from 'lucide-react';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-[#0a2540]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
