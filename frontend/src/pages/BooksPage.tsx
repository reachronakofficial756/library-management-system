import React, { useEffect, useState, useCallback } from 'react';
import { Search, PlusCircle, X, BookOpen, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { booksApi, getErrorMessage } from '../lib/api';
import type { Book, Genre, BookListParams } from '../types';
import { GENRES } from '../types';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_GENRES = ['All', ...GENRES];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const AvailabilityBadge: React.FC<{ available: number; total: number }> = ({
  available,
  total,
}) => {
  const pct = total > 0 ? available / total : 0;
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 tabular-nums">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        0/{total} (Out)
      </span>
    );
  }
  if (pct < 0.3) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 tabular-nums">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {available}/{total} Low
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 tabular-nums">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {available}/{total}
    </span>
  );
};

// ─── Add Book Modal ───────────────────────────────────────────────────────────
const AddBookModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    title: '',
    author: '',
    ISBN: '',
    genre: 'Fiction' as Genre,
    totalCopies: 1,
    availableCopies: 1,
    description: '',
    publishedYear: new Date().getFullYear(),
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await booksApi.create(form);
      toast.success('Book added successfully!');
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
            <h2 className="text-lg font-bold text-[#0a2540]">Add New Book</h2>
            <p className="text-xs text-slate-500">Enter catalog specifications for the volume</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Clean Code"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Author *</label>
              <input
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Robert C. Martin"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN (10 or 13 digits) *</label>
              <input
                required
                value={form.ISBN}
                onChange={(e) => setForm({ ...form, ISBN: e.target.value })}
                placeholder="9780132350884"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Genre</label>
              <select
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value as Genre })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Copies *</label>
              <input
                type="number"
                min="1"
                required
                value={form.totalCopies}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setForm({ ...form, totalCopies: val, availableCopies: val });
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Available *</label>
              <input
                type="number"
                min="0"
                max={form.totalCopies}
                required
                value={form.availableCopies}
                onChange={(e) =>
                  setForm({ ...form, availableCopies: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
              <input
                type="number"
                value={form.publishedYear}
                onChange={(e) =>
                  setForm({ ...form, publishedYear: parseInt(e.target.value) || 2024 })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief summary..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 resize-none"
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
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#635bff] hover:bg-[#533afd] shadow-sm shadow-[#635bff]/25 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Books Page ──────────────────────────────────────────────────────────
const BooksPage: React.FC = () => {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: BookListParams = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedGenre !== 'All') params.genre = selectedGenre;

      const res = await booksApi.getAll(params);
      setBooks(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedGenre, sortBy, sortOrder]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await booksApi.delete(id);
      toast.success('Book deleted');
      fetchBooks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns: Column<Book>[] = [
    {
      key: 'title',
      header: 'Title & Author',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f0f0ff] text-[#635bff] flex items-center justify-center shrink-0">
            <BookOpen size={16} />
          </div>
          <div>
            <div className="font-semibold text-[#0a2540]">{row.title}</div>
            <div className="text-xs text-slate-500">{row.author}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'ISBN',
      header: 'ISBN',
      render: (val) => (
        <span className="font-mono text-xs tabular-nums text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {String(val)}
        </span>
      ),
    },
    {
      key: 'genre',
      header: 'Genre',
      render: (val) => (
        <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#f0f0ff] text-[#635bff] border border-[#635bff]/15">
          {String(val)}
        </span>
      ),
    },
    {
      key: 'availableCopies',
      header: 'Availability',
      sortable: true,
      render: (_, row) => (
        <AvailabilityBadge available={row.availableCopies} total={row.totalCopies} />
      ),
    },
    {
      key: 'publishedYear',
      header: 'Year',
      render: (val) => <span className="tabular-nums text-slate-500 text-xs">{String(val || '—')}</span>,
    },
    ...(isLibrarian
      ? [
          {
            key: '_id',
            header: '',
            render: (_: unknown, row: Book) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row._id, row.title);
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete book"
              >
                <Trash2 size={15} />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a2540]">Book Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            {total} registered title{total !== 1 ? 's' : ''} in the system
          </p>
        </div>
        {isLibrarian && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#635bff] hover:bg-[#533afd] text-white text-xs font-semibold shadow-md shadow-[#635bff]/25 transition-all"
          >
            <PlusCircle size={16} />
            <span>Add New Book</span>
          </button>
        )}
      </div>

      {/* Search & Genre Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, author, or ISBN..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs text-[#0a2540] placeholder:text-slate-400 focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Horizontal scrollable genre pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {AVAILABLE_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => {
                setSelectedGenre(g);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedGenre === g
                  ? 'bg-[#0a2540] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={books}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No books matching your criteria."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowKey={(b) => b._id}
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
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchBooks}
        />
      )}
    </div>
  );
};

export default BooksPage;
