import React, { useEffect, useState } from 'react';
import { Loader2, Search, X, User, BookOpen, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { booksApi, membersApi, borrowApi, getErrorMessage } from '../lib/api';
import type { Book, Member } from '../types';
import { formatDate } from '../lib/date';

interface IssuePageState {
  books: Book[];
  members: Member[];
  bookSearch: string;
  memberSearch: string;
  selectedBook: Book | null;
  selectedMember: Member | null;
  dueDate: string;
  isSubmitting: boolean;
  isBooksLoading: boolean;
  isMembersLoading: boolean;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

const IssueBookPage: React.FC = () => {
  const [state, setState] = useState<IssuePageState>({
    books: [],
    members: [],
    bookSearch: '',
    memberSearch: '',
    selectedBook: null,
    selectedMember: null,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isSubmitting: false,
    isBooksLoading: false,
    isMembersLoading: false,
    mounting: true,
    updating: false,
    unmounting: false,
  });

  const isBooksInitialMount = React.useRef(true);
  const isMembersInitialMount = React.useRef(true);

  // Search books effect
  useEffect(() => {
    let isCurrent = true;

    // Track and update mounting vs updating state
    if (isBooksInitialMount.current) {
      isBooksInitialMount.current = false;
      setState((prev) => ({
        ...prev,
        mounting: true,
        updating: false,
        unmounting: false,
        isBooksLoading: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: true,
        unmounting: false,
        isBooksLoading: true,
      }));
    }

    const timer = setTimeout(async () => {
      try {
        const res = await booksApi.getAll({
          search: state.bookSearch || undefined,
          available: true,
          limit: 8,
        });
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            books: res.data.data,
            isBooksLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      } catch {
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            isBooksLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      }
    }, 300);

    // Track and update unmounting state in cleanup
    return () => {
      isCurrent = false;
      clearTimeout(timer);
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: false,
        unmounting: true,
      }));
    };
  }, [state.bookSearch]);

  // Search members effect
  useEffect(() => {
    let isCurrent = true;

    // Track and update mounting vs updating state
    if (isMembersInitialMount.current) {
      isMembersInitialMount.current = false;
      setState((prev) => ({
        ...prev,
        mounting: true,
        updating: false,
        unmounting: false,
        isMembersLoading: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: true,
        unmounting: false,
        isMembersLoading: true,
      }));
    }

    const timer = setTimeout(async () => {
      try {
        const res = await membersApi.getAll({
          search: state.memberSearch || undefined,
          limit: 8,
        });
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            members: res.data.data,
            isMembersLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      } catch {
        if (isCurrent) {
          setState((prev) => ({
            ...prev,
            isMembersLoading: false,
            mounting: false,
            updating: false,
          }));
        }
      }
    }, 300);

    // Track and update unmounting state in cleanup
    return () => {
      isCurrent = false;
      clearTimeout(timer);
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: false,
        unmounting: true,
      }));
    };
  }, [state.memberSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedBook || !state.selectedMember) {
      toast.error('Please select both a book and a member');
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await borrowApi.issueBook({
        bookId: state.selectedBook._id,
        memberId: state.selectedMember._id,
        dueDate: state.dueDate,
      });
      toast.success(
        `"${state.selectedBook.title}" issued to ${state.selectedMember.name} successfully!`
      );
      // Reset form
      setState((prev) => ({
        ...prev,
        selectedBook: null,
        selectedMember: null,
        bookSearch: '',
        memberSearch: '',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a2540]">Issue Book</h1>
        <p className="text-xs text-slate-500 mt-1">
          Atomic checkout workflow with real-time stock and borrow-limit validation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* Left Column: Select Book & Member */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* 1. Book Selection */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#f0f0ff] text-[#635bff] font-bold text-xs flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-[#0a2540]">Select Book</h2>
              </div>
              {state.selectedBook && (
                <button
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, selectedBook: null }))}
                  className="text-xs text-[#635bff] font-medium hover:underline flex items-center gap-1"
                >
                  <X size={12} />
                  Change
                </button>
              )}
            </div>

            {state.selectedBook ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0a2540]">{state.selectedBook.title}</h3>
                    <p className="text-xs text-slate-500">{state.selectedBook.author} · {state.selectedBook.ISBN}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  {state.selectedBook.availableCopies} available
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={state.bookSearch}
                    onChange={(e) => setState((prev) => ({ ...prev, bookSearch: e.target.value }))}
                    placeholder="Search available books by title or author..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                  {state.isBooksLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="spin text-[#635bff]" />
                      <span>Searching books...</span>
                    </div>
                  ) : state.books.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No available books found.
                    </div>
                  ) : (
                    state.books.map((b) => (
                      <div
                        key={b._id}
                        onClick={() => setState((prev) => ({ ...prev, selectedBook: b }))}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#0a2540]">{b.title}</p>
                          <p className="text-[11px] text-slate-500">{b.author} · {b.genre}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {b.availableCopies} in stock
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Member Selection */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#f0f0ff] text-[#635bff] font-bold text-xs flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-[#0a2540]">Select Member</h2>
              </div>
              {state.selectedMember && (
                <button
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, selectedMember: null }))}
                  className="text-xs text-[#635bff] font-medium hover:underline flex items-center gap-1"
                >
                  <X size={12} />
                  Change
                </button>
              )}
            </div>

            {state.selectedMember ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0a2540]">{state.selectedMember.name}</h3>
                    <p className="text-xs text-slate-500">{state.selectedMember.membershipId} · {state.selectedMember.email}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full capitalize">
                  {state.selectedMember.role}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={state.memberSearch}
                    onChange={(e) => setState((prev) => ({ ...prev, memberSearch: e.target.value }))}
                    placeholder="Search member by name, email, or ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                  {state.isMembersLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="spin text-[#635bff]" />
                      <span>Searching members...</span>
                    </div>
                  ) : state.members.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No members found.
                    </div>
                  ) : (
                    state.members.map((m) => (
                      <div
                        key={m._id}
                        onClick={() => setState((prev) => ({ ...prev, selectedMember: m }))}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#0a2540]">{m.name}</p>
                          <p className="text-[11px] text-slate-500">{m.membershipId} · {m.email}</p>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                          {m.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Details & Confirm */}
        <div className="space-y-5 sm:space-y-6 lg:sticky lg:top-24 w-full">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#f0f0ff] text-[#635bff] font-bold text-xs flex items-center justify-center">3</span>
              <h2 className="text-sm font-bold text-[#0a2540]">Loan Terms</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={state.dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setState((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 14 days standard borrowing duration</p>
            </div>

            {/* Review Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Book:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                  {state.selectedBook ? state.selectedBook.title : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {state.selectedMember ? state.selectedMember.name : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Return By:</span>
                <span className="font-semibold text-indigo-700 text-right">
                  {formatDate(state.dueDate)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={state.isSubmitting || !state.selectedBook || !state.selectedMember}
              className="w-full py-3 px-4 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-md shadow-[#635bff]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isSubmitting ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <>
                  <span>Complete Checkout</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default IssueBookPage;
