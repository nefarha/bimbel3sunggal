import { Navigate, useLocation } from 'react-router-dom';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

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

  return children;
};

export default ProtectedRoute;
