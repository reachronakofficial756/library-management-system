import React, { useEffect, useState } from 'react';
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
interface AddMemberModalState {
  name: string;
  email: string;
  membershipId: string;
  role: 'member' | 'librarian';
  password: string;
  isLoading: boolean;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

const AddMemberModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [modalState, setModalState] = useState<AddMemberModalState>({
    name: '',
    email: '',
    membershipId: '',
    role: 'member',
    password: '',
    isLoading: false,
    mounting: true,
    updating: false,
    unmounting: false,
  });

  const isModalInitial = React.useRef(true);
  useEffect(() => {
    if (isModalInitial.current) {
      isModalInitial.current = false;
      setModalState((prev) => ({ ...prev, mounting: true, updating: false, unmounting: false }));
    } else {
      setModalState((prev) => ({ ...prev, mounting: false, updating: true, unmounting: false }));
    }
    return () => {
      setModalState((prev) => ({ ...prev, mounting: false, updating: false, unmounting: true }));
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      await membersApi.create({
        name: modalState.name,
        email: modalState.email,
        membershipId: modalState.membershipId,
        role: modalState.role,
        password: modalState.password || undefined,
      });
      toast.success('Member registered successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
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
                value={modalState.name}
                onChange={(e) => setModalState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Rohan Mehta"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                required
                type="email"
                value={modalState.email}
                onChange={(e) => setModalState((prev) => ({ ...prev, email: e.target.value }))}
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
                value={modalState.membershipId}
                onChange={(e) => setModalState((prev) => ({ ...prev, membershipId: e.target.value.toUpperCase() }))}
                placeholder="STU2024XX"
                maxLength={12}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
              <select
                value={modalState.role}
                onChange={(e) => setModalState((prev) => ({ ...prev, role: e.target.value as 'member' | 'librarian' }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              >
                <option value="member">Student / Member</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={modalState.password}
              onChange={(e) => setModalState((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Default: member123"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
            />
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
              disabled={modalState.isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#635bff] hover:bg-[#533afd] shadow-sm shadow-[#635bff]/25 disabled:opacity-50"
            >
              {modalState.isLoading ? 'Registering...' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Members Page ────────────────────────────────────────────────────────
interface MembersPageState {
  members: Member[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  search: string;
  roleFilter: string;
  showAddModal: boolean;
  refreshTrigger: number;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

const MembersPage: React.FC = () => {
  const [state, setState] = useState<MembersPageState>({
    members: [],
    isLoading: true,
    page: 1,
    totalPages: 1,
    total: 0,
    search: '',
    roleFilter: '',
    showAddModal: false,
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

    const loadMembers = async () => {
      try {
        const res = await membersApi.getAll({
          page: state.page,
          limit: 10,
          search: state.search.trim() || undefined,
          role: state.roleFilter || undefined,
        });
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            members: res.data.data,
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

    loadMembers();

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
  }, [state.page, state.search, state.roleFilter, state.refreshTrigger]);

  const refresh = () => {
    setState((prev) => ({ ...prev, refreshTrigger: prev.refreshTrigger + 1 }));
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">Library Members</h1>
          <p className="text-xs text-slate-500 mt-1">
            {state.total} registered student and faculty member{state.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setState((prev) => ({ ...prev, showAddModal: true }))}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-md shadow-[#635bff]/25 transition-all w-full sm:w-auto"
        >
          <PlusCircle size={16} />
          <span>Register Member</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => {
              setState((prev) => ({ ...prev, search: e.target.value, page: 1 }));
            }}
            placeholder="Search by name, email, or membership ID..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {['', 'member', 'librarian'].map((role) => (
            <button
              key={role}
              onClick={() => {
                setState((prev) => ({ ...prev, roleFilter: role, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${
                state.roleFilter === role
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
        data={state.members}
        columns={columns}
        isLoading={state.isLoading}
        emptyMessage="No members found matching your search."
        rowKey={(m) => m._id}
      />

      {/* Pagination */}
      <Pagination
        currentPage={state.page}
        totalPages={state.totalPages}
        onPageChange={(p) => setState((prev) => ({ ...prev, page: p }))}
        total={state.total}
        limit={10}
      />

      {/* Modal */}
      {state.showAddModal && (
        <AddMemberModal
          onClose={() => setState((prev) => ({ ...prev, showAddModal: false }))}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

export default MembersPage;
