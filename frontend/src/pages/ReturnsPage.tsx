import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import { formatDate, isPastDate } from '../lib/date';
import toast from 'react-hot-toast';
import { borrowApi, getErrorMessage } from '../lib/api';
import type { BorrowRecord } from '../types';
import Pagination from '../components/Pagination';

interface ReturnsPageState {
  records: BorrowRecord[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  statusFilter: string;
  returningId: string | null;
  refreshTrigger: number;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

const ReturnsPage: React.FC = () => {
  const [state, setState] = useState<ReturnsPageState>({
    records: [],
    isLoading: true,
    page: 1,
    totalPages: 1,
    total: 0,
    statusFilter: 'issued',
    returningId: null,
    refreshTrigger: 0,
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

    const loadRecords = async () => {
      try {
        const res = await borrowApi.getAll({
          page: state.page,
          limit: 10,
          status: state.statusFilter || undefined,
        });
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            records: res.data.data,
            totalPages: res.data.pagination.totalPages,
            total: res.data.pagination.total,
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

    loadRecords();

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
  }, [state.page, state.statusFilter, state.refreshTrigger]);

  const refresh = () => {
    setState((prev) => ({ ...prev, refreshTrigger: prev.refreshTrigger + 1 }));
  };

  const handleReturn = async (borrowId: string, bookTitle: string) => {
    if (!window.confirm(`Process return for "${bookTitle}"?`)) return;
    setState((prev) => ({ ...prev, returningId: borrowId }));
    try {
      await borrowApi.returnBook(borrowId);
      toast.success('Book returned successfully.');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setState((prev) => ({ ...prev, returningId: null }));
    }
  };

  const getStatusIcon = (record: BorrowRecord) => {
    if (record.status === 'returned') {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle size={18} />
        </div>
      );
    }
    if (record.status === 'overdue' || (record.status === 'issued' && isPastDate(new Date(record.dueDate)))) {
      return (
        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-[#f0f0ff] text-[#635bff] flex items-center justify-center shrink-0">
        <Clock size={18} />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">Book Returns</h1>
          <p className="text-xs text-slate-500 mt-1">
            {state.total} loan record{state.total !== 1 ? 's' : ''} in system
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full scrollbar-none">
          {[
            { label: 'Currently Issued', value: 'issued' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Returned', value: 'returned' },
            { label: 'All Records', value: '' },
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

      {/* Record Cards List */}
      {state.isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 size={18} className="spin text-[#635bff]" />
          <span>Loading return records...</span>
        </div>
      ) : state.records.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <RefreshCw size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No records found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no books currently matching this return status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.records.map((record) => {
            const isOverdue =
              record.status !== 'returned' && isPastDate(new Date(record.dueDate));
            return (
              <div
                key={record._id}
                className={`p-5 rounded-2xl border transition-all bg-white shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOverdue ? 'border-red-200 bg-red-50/20' : 'border-slate-200/90'
                }`}
              >
                {/* Left: Book & Member Info */}
                <div className="flex items-start gap-4">
                  {getStatusIcon(record)}
                  <div>
                    <h3 className="font-semibold text-sm text-[#0a2540]">
                      {typeof record.book === 'object' ? record.book.title : '—'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Borrower: <strong className="text-slate-700">{typeof record.member === 'object' ? record.member.name : '—'}</strong> ·{' '}
                      <span className="font-mono text-slate-600">{typeof record.member === 'object' ? record.member.membershipId : ''}</span>
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

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                  {record.status !== 'returned' ? (
                    <button
                      onClick={() =>
                        handleReturn(
                          record._id,
                          typeof record.book === 'object' ? record.book.title : 'Book'
                        )
                      }
                      disabled={state.returningId === record._id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-2 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-xs shadow-[#635bff]/25 transition-all disabled:opacity-50 w-full md:w-auto"
                    >
                      {state.returningId === record._id ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <>
                          <span>Accept Return</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      ✓ Returned
                    </span>
                  )}
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

export default ReturnsPage;

