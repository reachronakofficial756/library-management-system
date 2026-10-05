import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import MembersPage from './pages/MembersPage';
import MemberHistoryPage from './pages/MemberHistoryPage';
import IssueBookPage from './pages/IssueBookPage';
import ReturnsPage from './pages/ReturnsPage';

/**
 * Route guard that restricts admin/librarian routes to authorized roles.
 * Regular members are safely redirected to /dashboard.
 */
const LibrarianRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian' || user?.role === 'admin';
  if (!isLibrarian) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1e2e',
            color: '#cdd6f4',
            border: '1px solid #313244',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#a6e3a1', secondary: '#1e1e2e' } },
          error: { iconTheme: { primary: '#f38ba8', secondary: '#1e1e2e' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route
            path="/members"
            element={
              <LibrarianRoute>
                <MembersPage />
              </LibrarianRoute>
            }
          />
          <Route path="/members/:id/history" element={<MemberHistoryPage />} />
          <Route
            path="/issue"
            element={
              <LibrarianRoute>
                <IssueBookPage />
              </LibrarianRoute>
            }
          />
          <Route
            path="/returns"
            element={
              <LibrarianRoute>
                <ReturnsPage />
              </LibrarianRoute>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
