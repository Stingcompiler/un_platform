import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './i18n';
import './index.css';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Departments from './pages/public/Departments';
import { Events, EventDetail } from './pages/public/Events';
import Contact from './pages/public/Contact';
import Policies from './pages/public/Policies';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Guest Route (redirect to dashboard if logged in)
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Public Layout with Navbar and Footer
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      {/* Public Routes with Navbar/Footer */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/departments" element={<PublicLayout><Departments /></PublicLayout>} />
      <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
      <Route path="/events/:id" element={<PublicLayout><EventDetail /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/policies" element={<PublicLayout><Policies /></PublicLayout>} />
      <Route path="/policies/:type" element={<PublicLayout><Policies /></PublicLayout>} />

      {/* Auth Routes with Navbar/Footer */}
      <Route path="/login" element={<PublicLayout><GuestRoute><Login /></GuestRoute></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><GuestRoute><Register /></GuestRoute></PublicLayout>} />

      {/* Dashboard Routes - No public Navbar/Footer */}
      <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

