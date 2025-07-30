
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentPage from './pages/StudentPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store';

function App() {

  const { checkAuth } = useAuthStore();


  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="App">

      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        
   
        <Route path="/register" element={<RegisterPage />} />
        

        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
      
        <Route 
          path="/student" 
          element={
            <ProtectedRoute requiredRole="ROLE_USER">
              <StudentPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
