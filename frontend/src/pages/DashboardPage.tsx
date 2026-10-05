import React, { useEffect, useState } from 'react';
import { BookOpen, Users, RefreshCw, AlertTriangle, TrendingUp, ArrowRight, BookMarked, CheckCircle2 } from 'lucide-react';
import { borrowApi, booksApi, membersApi } from '../lib/api';
import type { BorrowStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'indigo' | 'teal' | 'coral' | 'amber' | 'green';
  link?: string;
  trend?: string;
}

const colorStyles = {
  indigo: {
    iconBg: 'bg-[#f0f0ff] text-[#635bff]',
    border: 'hover:border-[#635bff]/40',
  },
  teal: {
    iconBg: 'bg-[#e6faf7] text-[#00d4b8]',
    border: 'hover:border-[#00d4b8]/40',
  },
  coral: {
    iconBg: 'bg-red-50 text-red-600',
    border: 'hover:border-red-300',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-300',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'hover:border-emerald-300',
  },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, link, trend }) => {
  const styles = colorStyles[color];
  const card = (
    <div
      className={`group relative bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.border}`}
    >
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${styles.iconBg} transition-transform group-hover:scale-110 shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-xl sm:text-2xl font-extrabold text-[#0a2540] tabular-nums tracking-tight">
          {value}
        </div>
        {trend && (
          <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
    </div>
  );

  return link ? <Link to={link} className="block">{card}</Link> : card;
};

interface DashboardState {
  stats: BorrowStats | null;
  totalBooks: number;
  totalMembers: number;
  isLoading: boolean;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  const [state, setState] = useState<DashboardState>({
    stats: null,
    totalBooks: 0,
    totalMembers: 0,
    isLoading: true,
    mounting: true,
    updating: false,
    unmounting: false,
  });

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    let isCurrent = true;

    // Track and update mounting vs updating state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setState((prev) => ({
        ...prev,
        mounting: true,
        updating: false,
        unmounting: false,
        isLoading: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: true,
        unmounting: false,
        isLoading: true,
      }));
    }

    const loadStats = async () => {
      try {
        const booksRes = await booksApi.getAll({ limit: 1 });
        let newStats: BorrowStats | null = null;
        let membersCount = 0;

        if (isLibrarian) {
          const [borrowRes, membersRes] = await Promise.all([
            borrowApi.getStats(),
            membersApi.getAll({ limit: 1 }),
          ]);
          newStats = borrowRes.data.data;
          membersCount = membersRes.data.pagination.total;
        }

        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            totalBooks: booksRes.data.pagination.total,
            stats: newStats,
            totalMembers: membersCount,
            isLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      } catch {
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      }
    };

    loadStats();

    // Track and update unmounting state in cleanup
    return () => {
      isCurrent = false;
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: false,
        unmounting: true,
      }));
    };
  }, [isLibrarian]);


  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0a2540] via-[#0d253d] to-[#1a1f36] p-5 sm:p-8 lg:p-10 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#635bff]/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 -mb-12 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-[#00d4b8]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#00d4b8] mb-2 sm:mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4b8] animate-pulse" />
              <span>{isLibrarian ? 'Librarian Workspace' : 'Student Library Portal'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              {isLibrarian
                ? 'Here is an overview of active catalog holdings, checkouts, and student operations.'
                : 'Browse our full catalog, track your active borrowings, and check due dates in real-time.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <Link
              to="/books"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0a2540] hover:bg-slate-100 font-semibold text-xs shadow-md transition-all active:scale-95 text-center"
            >
              <BookOpen size={15} />
              <span>Browse Catalog</span>
            </Link>
            {isLibrarian && (
              <Link
                to="/issue"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white font-semibold text-xs shadow-md shadow-[#635bff]/30 transition-all active:scale-95 text-center"
              >
                <BookMarked size={15} />
                <span>Issue Book</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-base font-bold text-[#0a2540]">Key Performance Indicators</h2>
          <span className="text-[11px] sm:text-xs text-slate-500">Real-time sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<BookOpen size={18} />}
            label="Total Catalog Books"
            value={state.isLoading ? '...' : state.totalBooks}
            color="indigo"
            link="/books"
            trend="+Live"
          />
          {isLibrarian ? (
            <>
              <StatCard
                icon={<Users size={18} />}
                label="Registered Members"
                value={state.isLoading ? '...' : state.totalMembers}
                color="teal"
                link="/members"
              />
              <StatCard
                icon={<RefreshCw size={18} />}
                label="Currently Issued"
                value={state.isLoading ? '...' : state.stats?.issued ?? 0}
                color="green"
                link="/returns"
              />
              <StatCard
                icon={<AlertTriangle size={18} />}
                label="Overdue Records"
                value={state.isLoading ? '...' : state.stats?.overdue ?? 0}
                color="coral"
                link="/returns"
              />
            </>
          ) : (

            <>
              <StatCard
                icon={<BookMarked size={18} />}
                label="My Borrow History"
                value="View"
                color="teal"
                link={`/members/${user?.id}/history`}
              />
              <StatCard
                icon={<CheckCircle2 size={18} />}
                label="Account Status"
                value="Active"
                color="green"
              />
              <StatCard
                icon={<TrendingUp size={18} />}
                label="Max Borrow Limit"
                value="Standard"
                color="amber"
              />
            </>
          )}
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-[#0a2540] mb-3 sm:mb-4">Quick Workflows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link
            to="/books"
            className="group flex flex-col justify-between p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-[#635bff]/40 transition-all"
          >
            <div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f0f0ff] text-[#635bff] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <BookOpen size={18} />
              </div>
              <h3 className="font-bold text-sm text-[#0a2540] mb-1">Explore Catalog</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter by genre, check live copy availability, and view ISBN details.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#635bff] mt-4 pt-3.5 border-t border-slate-100">
              <span>View books</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {isLibrarian ? (
            <>
              <Link
                to="/issue"
                className="group flex flex-col justify-between p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-[#635bff]/40 transition-all"
              >
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#e6faf7] text-[#00d4b8] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                    <BookMarked size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-[#0a2540] mb-1">Issue Book</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Check out books with automatic limit validation and concurrency protection.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00d4b8] mt-4 pt-3.5 border-t border-slate-100">
                  <span>Issue copy</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/members"
                className="group flex flex-col justify-between p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-[#635bff]/40 transition-all"
              >
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#fff8eb] text-amber-500 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-[#0a2540] mb-1">Member Directory</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Register students & faculty, manage library cards, and audit borrow history.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-4 pt-3.5 border-t border-slate-100">
                  <span>Manage members</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </>
          ) : (
            <Link
              to={`/members/${user?.id}/history`}
              className="group flex flex-col justify-between p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-[#635bff]/40 transition-all"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f0f0ff] text-[#635bff] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                  <BookMarked size={18} />
                </div>
                <h3 className="font-bold text-sm text-[#0a2540] mb-1">My Loans</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review your current book loans, check upcoming return deadlines, and view past history.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#635bff] mt-4 pt-3.5 border-t border-slate-100">
                <span>View my history</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
