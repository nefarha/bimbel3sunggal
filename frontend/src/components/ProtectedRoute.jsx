import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute — guards routes that require an authenticated session.
 *
 * Behavior:
 *   - No token in localStorage  → redirect to "/" (home) with replace.
 *   - Token exists, role mismatch → redirect to the role's own dashboard
 *     (or "/" when role is unknown), so users don't end up on a page
 *     they have no business viewing.
 *   - Otherwise render the wrapped page.
 *
 * Usage in App.jsx:
 *   <Route path="/admin/dashboard" element={
 *     <ProtectedRoute allowedRoles={['admin']}>
 *       <DashboardAdmin />
 *     </ProtectedRoute>
 *   } />
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  // 1) No session at all → kick back to home.
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // 2) Session exists, but role-based access was requested.
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    let parsedUser = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        parsedUser = null;
      }
    }

    const role = parsedUser?.role;
    if (!role || !allowedRoles.includes(role)) {
      switch (role) {
        case 'tutor':
          return <Navigate to="/tutor/dashboard" replace />;
        case 'siswa':
          return <Navigate to="/siswa/profile" replace />;
        case 'pemilik':
          return <Navigate to="/owner/laporan-keuangan" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  // 3) Authenticated (and authorized) → render the page.
  return children;
};

export default ProtectedRoute;
