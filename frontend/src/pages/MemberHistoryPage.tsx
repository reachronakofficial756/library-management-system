import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDate, isPastDate } from '../lib/date';
import toast from 'react-hot-toast';
import { membersApi, getErrorMessage } from '../lib/api';
import type { BorrowRecord, Member } from '../types';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ record: BorrowRecord }> = ({ record }) => {
  const isOverdue =
    record.status === 'issued' && isPastDate(new Date(record.dueDate));

  if (record.status === 'returned') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle size={12} className="text-emerald-500" />
        Returned
      </span>
    );
  }
  if (isOverdue || record.status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle size={12} className="text-red-500" />
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <Clock size={12} className="text-blue-500" />
      Active Loan
    </span>
  );
};

interface MemberHistoryPageState {
  member: Partial<Member> | null;
  records: BorrowRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  statusFilter: string;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

// ─── Member History Page ──────────────────────────────────────────────────────
const MemberHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [state, setState] = useState<MemberHistoryPageState>({
    member: null,
    records: [],
    isLoading: true,
    page: 1,
    totalPages: 1,
    total: 0,
    statusFilter: '',
    mounting: true,
    updating: false,
    unmounting: false,
  });

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (!id) return;
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

    const load = async () => {
      try {
        const res = await membersApi.getHistory(id, {
          page: state.page,
          limit: 10,
          status: state.statusFilter || undefined,
        });
        const { member: m, records: r, pagination } = res.data.data;
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            member: m,
            records: r,
            totalPages: pagination.totalPages,
            total: pagination.total,
            isLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      } catch (err) {
        if (isCurrent) {
          toast.error(getErrorMessage(err));
          setState((prev) => ({
            ...prev,
            isLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      }
    };

    load();

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
  }, [id, state.page, state.statusFilter]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  const handleBack = () => {
    if (!isLibrarian) {
      // Regular members should go to dashboard (home)
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/members');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs shrink-0 cursor-pointer"
            title={isLibrarian ? 'Go back' : 'Back to Home'}
            aria-label={isLibrarian ? 'Go back' : 'Back to Home'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">
              {state.member ? `${state.member.name}'s History` : 'Borrow History'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {state.member?.membershipId} · {state.member?.email}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full scrollbar-none">
          {[
            { label: 'All', value: '' },
            { label: 'Issued', value: 'issued' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Returned', value: 'returned' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setState((prev) => ({ ...prev, statusFilter: tab.value, page: 1 }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                state.statusFilter === tab.value
                  ? 'bg-white text-[#635bff] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Record Cards */}
      {state.isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading history...</div>
      ) : state.records.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <BookOpen size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No records found</h3>
          <p className="text-xs text-slate-400 mt-1">This member has no borrowings matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.records.map((record) => {
            const isOverdue =
              record.status === 'issued' && isPastDate(new Date(record.dueDate));
            return (
              <div
                key={record._id}
                className={`p-5 rounded-2xl border transition-all bg-white shadow-xs hover:shadow-md ${
                  isOverdue
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOverdue
                          ? 'bg-red-50 text-red-600'
                          : 'bg-[#f0f0ff] text-[#635bff]'
                      }`}
                    >
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#0a2540]">
                        {typeof record.book === 'object' ? record.book.title : '—'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {typeof record.book === 'object' ? record.book.author : ''} ·{' '}
                        <span className="font-mono">{typeof record.book === 'object' ? record.book.ISBN : ''}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                        <span>Issued: <strong className="text-slate-700">{formatDate(record.issueDate)}</strong></span>
                        <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                          Due: <strong className={isOverdue ? 'text-red-600' : 'text-slate-700'}>{formatDate(record.dueDate)}</strong>
                        </span>
                        {record.returnDate && (
                          <span className="text-emerald-700">
                            Returned: <strong>{formatDate(record.returnDate)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                    <StatusBadge record={record} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={state.page}
        totalPages={state.totalPages}
        onPageChange={(p) => setState((prev) => ({ ...prev, page: p }))}
        total={state.total}
        limit={10}
      />
    </div>
  );
};

export default MemberHistoryPage;
