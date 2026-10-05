import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  limit: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  total,
  limit,
}) => {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-1">
      <span className="text-xs font-medium text-slate-500 tabular-nums">
        Showing <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span> records
      </span>
      <div className="flex items-center gap-1.5">
        <button
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-all ${
                currentPage === page
                  ? 'bg-[#635bff] text-white font-semibold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        )}

        <button
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
