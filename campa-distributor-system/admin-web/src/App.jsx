import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Placeholder Routes */}
        <Route path="/orders" element={<ProtectedRoute><div>Orders (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><div>Products (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/retailers" element={<ProtectedRoute><div>Retailers (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute><div>Deliveries (Coming Soon)</div></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><div>Payments (Coming Soon)</div></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
