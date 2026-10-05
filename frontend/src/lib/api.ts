import type {
  ApiResponse,
  PaginatedResponse,
  Book,
  Member,
  BorrowRecord,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  BookListParams,
  IssueBookForm,
  AddBookForm,
  MemberStats,
  BorrowStats,
  MemberHistoryData,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data || {};
  }
}

/**
 * Native fetch-based request client
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> {
  const token = localStorage.getItem('shelflife_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('shelflife_token');
    localStorage.removeItem('shelflife_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data && typeof data === 'object' && 'message' in data)
      ? String(data.message)
      : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return { data };
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([_, val]) => val !== undefined && val !== null && val !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return (error.data?.message as string) || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials: LoginCredentials) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterData) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request<ApiResponse<Member>>('/auth/me'),
};

// ─── Books API ────────────────────────────────────────────────────────────────
export const booksApi = {
  getAll: (params?: BookListParams) =>
    request<PaginatedResponse<Book>>(`/books${buildQuery(params as unknown as Record<string, unknown>)}`),

  getById: (id: string) =>
    request<ApiResponse<Book>>(`/books/${id}`),

  create: (data: AddBookForm) =>
    request<ApiResponse<Book>>('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AddBookForm>) =>
    request<ApiResponse<Book>>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<ApiResponse<null>>(`/books/${id}`, {
      method: 'DELETE',
    }),

  getGenres: () =>
    request<ApiResponse<string[]>>('/books/genres'),
};

// ─── Members API ──────────────────────────────────────────────────────────────
export const membersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    request<PaginatedResponse<Member>>(`/members${buildQuery(params as Record<string, unknown>)}`),

  getById: (id: string) =>
    request<ApiResponse<Member>>(`/members/${id}`),

  create: (data: Partial<Member> & { password?: string }) =>
    request<ApiResponse<Member>>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Member>) =>
    request<ApiResponse<Member>>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getHistory: (id: string, params?: { page?: number; limit?: number; status?: string }) =>
    request<ApiResponse<MemberHistoryData>>(`/members/${id}/history${buildQuery(params as Record<string, unknown>)}`),

  getStats: (id: string) =>
    request<ApiResponse<MemberStats>>(`/members/${id}/stats`),
};

// ─── Borrow API ───────────────────────────────────────────────────────────────
export const borrowApi = {
  issueBook: (data: IssueBookForm) =>
    request<ApiResponse<BorrowRecord>>('/borrow', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  returnBook: (borrowId: string) =>
    request<ApiResponse<{ borrowRecord: BorrowRecord; fine: number }>>(`/borrow/return/${borrowId}`, {
      method: 'POST',
    }),

  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    request<PaginatedResponse<BorrowRecord>>(`/borrow${buildQuery(params as Record<string, unknown>)}`),

  getStats: () =>
    request<ApiResponse<BorrowStats>>('/borrow/stats'),
};
