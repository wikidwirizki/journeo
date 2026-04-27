import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MobileLayout from './components/layout/MobileLayout';
import Trips from './pages/Trips';
import TripDetails from './pages/TripDetails';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<MobileLayout />}>
            <Route path="/" element={<PrivateRoute><Trips /></PrivateRoute>} />
            <Route path="/trip/:id" element={<TripDetails />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}


