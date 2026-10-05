import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDate, isPastDate } from '../lib/date';
import toast from 'react-hot-toast';
import { membersApi, getErrorMessage } from '../lib/api';
import type { BorrowRecord, Member } from '../types';
import Pagination from '../components/Pagination';

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

// ─── Member History Page ──────────────────────────────────────────────────────
const MemberHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [member, setMember] = useState<Partial<Member> | null>(null);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await membersApi.getHistory(id, {
          page,
          limit: 10,
          status: statusFilter || undefined,
        });
        const { member: m, records: r, pagination } = res.data.data;
        setMember(m);
        setRecords(r);
        setTotalPages(pagination.totalPages);
        setTotal(pagination.total);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/members"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            title="Back to members"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0a2540]">
              {member ? `${member.name}'s History` : 'Borrow History'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {member?.membershipId} · {member?.email}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { label: 'All', value: '' },
            { label: 'Issued', value: 'issued' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Returned', value: 'returned' },
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

      {/* Record Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading history...</div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <BookOpen size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No records found</h3>
          <p className="text-xs text-slate-400 mt-1">This member has no borrowings matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
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
                    {record.fine > 0 && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        ₹{record.fine} fine
                      </span>
                    )}
                  </div>
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

export default MemberHistoryPage;
