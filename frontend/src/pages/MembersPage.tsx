import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Search, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { membersApi, getErrorMessage } from '../lib/api';
import type { Member } from '../types';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/date';

// ─── Add Member Modal ─────────────────────────────────────────────────────────
const AddMemberModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    membershipId: '',
    phone: '',
    department: '',
    role: 'member' as 'member' | 'librarian',
    password: '',
    maxBorrowLimit: 5,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await membersApi.create(form);
      toast.success('Member registered successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#0a2540]">Register New Member</h2>
            <p className="text-xs text-slate-500">Create an account for a student or faculty member</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rohan Mehta"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="rohan@college.edu"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Membership ID *</label>
              <input
                required
                value={form.membershipId}
                onChange={(e) => setForm({ ...form, membershipId: e.target.value.toUpperCase() })}
                placeholder="STU2024XX"
                maxLength={12}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91-9876543210"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Computer Science"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as 'member' | 'librarian' })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              >
                <option value="member">Student / Member</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Default: member123"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Borrow Limit</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.maxBorrowLimit}
                onChange={(e) =>
                  setForm({ ...form, maxBorrowLimit: parseInt(e.target.value) || 5 })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#635bff] hover:bg-[#533afd] shadow-sm shadow-[#635bff]/25 disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Members Page ────────────────────────────────────────────────────────
const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await membersApi.getAll({
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      setMembers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Member',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#635bff] to-[#00d4b8] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#0a2540]">{row.name}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'membershipId',
      header: 'Membership ID',
      render: (val) => (
        <span className="font-mono text-xs tabular-nums text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          {String(val)}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (val) => <span className="text-xs text-slate-600">{String(val || '—')}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (val) => (
        <span
          className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${
            val === 'librarian'
              ? 'bg-[#f0f0ff] text-[#635bff] border border-[#635bff]/20'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: 'joinedDate',
      header: 'Joined',
      render: (val) => <span className="text-xs text-slate-500 tabular-nums">{formatDate(String(val))}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (val) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            val
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
              : 'bg-red-50 text-red-700 border border-red-200/80'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {val ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: '_id',
      header: 'History',
      render: (_, row) => (
        <Link
          to={`/members/${row._id}/history`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#635bff] hover:text-[#533afd] hover:bg-[#f0f0ff] px-2.5 py-1 rounded-lg transition-colors"
        >
          <span>History</span>
          <ArrowRight size={12} />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a2540]">Library Members</h1>
          <p className="text-xs text-slate-500 mt-1">
            {total} registered student and faculty member{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-md shadow-[#635bff]/25 transition-all"
        >
          <PlusCircle size={16} />
          <span>Register Member</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or membership ID..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['', 'member', 'librarian'].map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                roleFilter === role
                  ? 'bg-[#0a2540] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {role === '' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={members}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No members found matching your search."
        rowKey={(m) => m._id}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={total}
        limit={10}
      />

      {/* Modal */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  );
};

export default MembersPage;
