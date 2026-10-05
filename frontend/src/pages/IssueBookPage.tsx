import React, { useEffect, useState } from 'react';
import { Loader2, Search, X, User, BookOpen, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { booksApi, membersApi, borrowApi, getErrorMessage } from '../lib/api';
import type { Book, Member } from '../types';
import { formatDate } from '../lib/date';

const IssueBookPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [bookSearch, setBookSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Search books
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsBooksLoading(true);
      try {
        const res = await booksApi.getAll({
          search: bookSearch || undefined,
          available: true,
          limit: 8,
        });
        setBooks(res.data.data);
      } catch {
        // fail silently
      } finally {
        setIsBooksLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [bookSearch]);

  // Search members
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsMembersLoading(true);
      try {
        const res = await membersApi.getAll({
          search: memberSearch || undefined,
          limit: 8,
        });
        setMembers(res.data.data);
      } catch {
        // fail silently
      } finally {
        setIsMembersLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedMember) {
      toast.error('Please select both a book and a member');
      return;
    }

    setIsSubmitting(true);
    try {
      await borrowApi.issueBook({
        bookId: selectedBook._id,
        memberId: selectedMember._id,
        dueDate,
        notes,
      });
      toast.success(
        `"${selectedBook.title}" issued to ${selectedMember.name} successfully!`
      );
      // Reset form
      setSelectedBook(null);
      setSelectedMember(null);
      setBookSearch('');
      setMemberSearch('');
      setNotes('');
      setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a2540]">Issue Book</h1>
        <p className="text-xs text-slate-500 mt-1">
          Atomic checkout workflow with real-time stock and borrow-limit validation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Select Book & Member */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Book Selection */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#f0f0ff] text-[#635bff] font-bold text-xs flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-[#0a2540]">Select Book</h2>
              </div>
              {selectedBook && (
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="text-xs text-[#635bff] font-medium hover:underline flex items-center gap-1"
                >
                  <X size={12} />
                  Change
                </button>
              )}
            </div>

            {selectedBook ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0a2540]">{selectedBook.title}</h3>
                    <p className="text-xs text-slate-500">{selectedBook.author} · {selectedBook.ISBN}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  {selectedBook.availableCopies} available
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search available books by title or author..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                  {isBooksLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="spin text-[#635bff]" />
                      <span>Searching books...</span>
                    </div>
                  ) : books.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No available books found.
                    </div>
                  ) : (
                    books.map((b) => (
                      <div
                        key={b._id}
                        onClick={() => setSelectedBook(b)}
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#f0f0ff] text-[#635bff] font-bold text-xs flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-[#0a2540]">Select Member</h2>
              </div>
              {selectedMember && (
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-xs text-[#635bff] font-medium hover:underline flex items-center gap-1"
                >
                  <X size={12} />
                  Change
                </button>
              )}
            </div>

            {selectedMember ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0a2540]">{selectedMember.name}</h3>
                    <p className="text-xs text-slate-500">{selectedMember.membershipId} · {selectedMember.department || 'Student'}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  Limit: {selectedMember.maxBorrowLimit} books
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search member by name, email, or ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                  {isMembersLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="spin text-[#635bff]" />
                      <span>Searching members...</span>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No members found.
                    </div>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m._id}
                        onClick={() => setSelectedMember(m)}
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
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#f0f0ff] text-[#635bff] font-bold text-xs flex items-center justify-center">3</span>
              <h2 className="text-sm font-bold text-[#0a2540]">Loan Terms</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: 14 days standard borrowing duration</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Librarian Notes (optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condition remarks or special authorization..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 resize-none"
              />
            </div>

            {/* Review Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Book:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                  {selectedBook ? selectedBook.title : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedMember ? selectedMember.name : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Return By:</span>
                <span className="font-semibold text-indigo-700 text-right">
                  {formatDate(dueDate)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedBook || !selectedMember}
              className="w-full py-3 px-4 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-md shadow-[#635bff]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
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
