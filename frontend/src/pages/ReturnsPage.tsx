import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import { formatDate, isPastDate } from '../lib/date';
import toast from 'react-hot-toast';
import { borrowApi, getErrorMessage } from '../lib/api';
import type { BorrowRecord } from '../types';
import Pagination from '../components/Pagination';

const ReturnsPage: React.FC = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('issued');
  const [returningId, setReturningId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await borrowApi.getAll({ page, limit: 10, status: statusFilter || undefined });
      setRecords(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleReturn = async (borrowId: string, bookTitle: string) => {
    if (!window.confirm(`Return "${bookTitle}"? Fines will be calculated automatically at ₹5/day.`)) return;
    setReturningId(borrowId);
    try {
      const res = await borrowApi.returnBook(borrowId);
      const { fine } = res.data.data;
      toast.success(
        fine > 0
          ? `Book returned. Fine charged: ₹${fine}`
          : 'Book returned successfully. No overdue fine.'
      );
      fetchRecords();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReturningId(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a2540]">Book Returns & Fines</h1>
          <p className="text-xs text-slate-500 mt-1">
            {total} loan record{total !== 1 ? 's' : ''} in system
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { label: 'Currently Issued', value: 'issued' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Returned', value: 'returned' },
            { label: 'All Records', value: '' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.value
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
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 size={18} className="spin text-[#635bff]" />
          <span>Loading return records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <RefreshCw size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No records found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no books currently matching this return status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
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

                {/* Right: Actions & Fine */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {record.fine > 0 && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                      ₹{record.fine} Overdue Fine
                    </span>
                  )}

                  {record.status !== 'returned' ? (
                    <button
                      onClick={() =>
                        handleReturn(
                          record._id,
                          typeof record.book === 'object' ? record.book.title : 'Book'
                        )
                      }
                      disabled={returningId === record._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-xs shadow-[#635bff]/25 transition-all disabled:opacity-50"
                    >
                      {returningId === record._id ? (
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
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={total}
        limit={10}
      />
    </div>
  );
};

export default ReturnsPage;
