// ─── Types: Book (IA2: title, author, ISBN, genre, totalCopies, availableCopies) ─
export interface Book {
  _id: string;
  title: string;
  author: string;
  ISBN: string;
  genre: Genre;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  updatedAt: string;
}

export type Genre =
  | 'Fiction'
  | 'Non-Fiction'
  | 'Science'
  | 'Technology'
  | 'History'
  | 'Biography'
  | 'Self-Help'
  | 'Mystery'
  | 'Philosophy'
  | 'Other';

export const GENRES: Genre[] = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Self-Help',
  'Mystery',
  'Philosophy',
  'Other',
];

export type MemberRole = 'member' | 'librarian' | 'admin';

export interface Member {
  _id: string;
  name: string;
  email: string;
  membershipId: string;
  joinedDate: string;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
}

// ─── Types: BorrowRecord (IA2: book, member, issueDate, dueDate, returnDate, status)
export type BorrowStatus = 'issued' | 'returned' | 'overdue';

export interface BorrowRecord {
  _id: string;
  book: Book;
  member: Member;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: BorrowStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Types: Auth ──────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  membershipId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: AuthUser;
}

// ─── Types: API Responses ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface BookListParams {
  page?: number;
  limit?: number;
  genre?: string;
  search?: string;
  available?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BorrowStats {
  total: number;
  issued: number;
  returned: number;
  overdue: number;
}

export interface MemberStats {
  total: number;
  issued: number;
  returned: number;
  overdue: number;
  currentlyBorrowing: number;
}

// ─── Types: Forms ─────────────────────────────────────────────────────────────
export interface IssueBookForm {
  bookId: string;
  memberId: string;
  dueDate?: string;
}

export interface AddBookForm {
  title: string;
  author: string;
  ISBN: string;
  genre: Genre;
  totalCopies: number;
  availableCopies: number;
}

export interface AddMemberForm {
  name: string;
  email: string;
  membershipId: string;
  role: MemberRole;
  password?: string;
}

export interface MemberHistoryData {
  member: Partial<Member>;
  records: BorrowRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ComponentLifecycle {
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

