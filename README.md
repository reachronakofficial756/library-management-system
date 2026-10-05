# 📚 ShelfLife — Library Management Platform

A full-stack library management system built for the **IA2 Full Stack Web Development** exam.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Validation | Joi |
| Frontend | React + TypeScript (Vite) |
| Routing | React Router v6 |
| HTTP Client | Axios |
| UI | Vanilla CSS (custom design system) |

---

## 📁 Project Structure

```
library management system/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── models/         # Mongoose schemas
│   │   │   ├── Book.js
│   │   │   ├── Member.js
│   │   │   └── BorrowRecord.js
│   │   ├── routes/         # Express route definitions
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # auth, validation, error handling
│   │   ├── index.js        # App entry point
│   │   └── seed.js         # Database seeder
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── context/        # React Context (Auth)
    │   ├── lib/            # API client (axios)
    │   ├── types/          # TypeScript interfaces
    │   ├── components/     # Reusable components
    │   │   ├── DataTable.tsx   # Generic typed <DataTable<T>>
    │   │   ├── Pagination.tsx
    │   │   ├── Navbar.tsx
    │   │   └── ProtectedLayout.tsx
    │   └── pages/          # Route pages
    │       ├── LoginPage.tsx
    │       ├── DashboardPage.tsx
    │       ├── BooksPage.tsx
    │       ├── MembersPage.tsx
    │       ├── MemberHistoryPage.tsx
    │       ├── IssueBookPage.tsx
    │       └── ReturnsPage.tsx
    ├── .env
    └── package.json
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB running locally (or use MongoDB Atlas)

### Backend Setup

```bash
cd backend
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run seed      # Seed the database with sample data
npm run dev       # Start dev server on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
# .env already points to http://localhost:5000/api
npm run dev       # Start Vite dev server on http://localhost:5173
```

---

## 🔐 Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Librarian | ananya.sharma@college.edu | librarian123 |
| Member | rohan.mehta@college.edu | member123 |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | Protected | Get current user |

### Books
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/books` | Public | List books (pagination, search, genre filter) |
| GET | `/api/books/:id` | Public | Get single book |
| GET | `/api/books/genres` | Public | List all genres |
| POST | `/api/books` | Librarian | Add new book |
| PUT | `/api/books/:id` | Librarian | Update book |
| DELETE | `/api/books/:id` | Admin | Delete book |

### Members
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/members` | Librarian | List all members |
| POST | `/api/members` | Librarian | Register new member |
| GET | `/api/members/:id` | Protected | Get member by ID |
| PUT | `/api/members/:id` | Librarian | Update member |
| GET | `/api/members/:id/history` | Protected | Member borrow history |
| GET | `/api/members/:id/stats` | Protected | Member borrowing stats |

### Borrow
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/borrow` | Librarian | Issue a book |
| POST | `/api/borrow/return/:borrowId` | Librarian | Return a book |
| GET | `/api/borrow` | Librarian | List all borrow records |
| GET | `/api/borrow/stats` | Librarian | Borrowing statistics |

---

## 🛡️ Race Condition Prevention

When issuing the last copy of a book, we use **MongoDB's atomic `findOneAndUpdate`** with a conditional filter:

```javascript
const updatedBook = await Book.findOneAndUpdate(
  { _id: bookId, availableCopies: { $gt: 0 } },  // only if > 0
  { $inc: { availableCopies: -1 } },               // atomic decrement
  { new: true, session }
);
```

This ensures the borrow record is only created if the book decrement succeeds. If two librarians hit the endpoint simultaneously, only one will get `updatedBook !== null` — the other gets a 400 response.

### 🧪 Concurrency Test Script

To verify zero race conditions under concurrent load:
```bash
npm run test:concurrency
# or from root:
# npm run test:concurrency
```
This script launches simultaneous checkout requests against a single book with exactly 1 available copy and verifies that exactly 1 checkout succeeds while all other concurrent requests are safely rejected without negative inventory.

---

## 🏛️ System Design Notes (Q3)

### Architecture for Scale (500 campuses, 2M members)
- **Load Balancer** → Multiple Node.js instances (horizontal scaling)
- **MongoDB Sharded Cluster** with:
  - `Book`: shard key = `{ genre: 1, _id: 1 }` (even distribution)
  - `BorrowRecord`: shard key = `{ member: 1, issueDate: 1 }` (query locality)
- **Redis Cache** for book catalog (TTL: 5 min, invalidated on update)
- **CDN** for static frontend assets
- **Auto-scaling** (AWS ASG / GCP MIG) for semester traffic spikes
- **Message Queue** (Redis/SQS) for async fine calculation and notifications

### State Management (Frontend)
Local state (`useState`) + React Context for auth. No external library needed at this scale — React Query would be added for production caching.
