import React from 'react';
import { ChevronUp, ChevronDown, Loader2, Inbox } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No records found',
  sortBy,
  sortOrder = 'asc',
  onSort,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  const getCellValue = (row: T, key: keyof T | string): unknown => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: unknown, k) => {
        if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
        return undefined;
      }, row);
    }
    return row[key as keyof T];
  };

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[580px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`px-4 sm:px-5 py-3.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase ${
                    col.sortable && onSort ? 'cursor-pointer select-none hover:text-[#0a2540]' : ''
                  }`}
                  onClick={() => col.sortable && onSort && onSort(String(col.key))}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && onSort && (
                      <span className="flex flex-col text-slate-300">
                        <ChevronUp
                          size={10}
                          className={sortBy === col.key && sortOrder === 'asc' ? 'text-[#635bff] font-bold' : ''}
                        />
                        <ChevronDown
                          size={10}
                          className={sortBy === col.key && sortOrder === 'desc' ? 'text-[#635bff] font-bold' : ''}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="text-[#635bff] spin" />
                    <span className="text-xs">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox size={32} className="text-slate-300" />
                    <p className="font-medium text-slate-600 text-xs">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={`transition-colors hover:bg-slate-50/60 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-[#0a2540] align-middle">
                      {col.render
                        ? col.render(getCellValue(row, col.key), row)
                        : String(getCellValue(row, col.key) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
