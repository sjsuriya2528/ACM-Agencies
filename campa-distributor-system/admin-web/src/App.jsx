import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoaderProvider, useLoader } from './context/LoaderContext';
import GlobalLoader from './components/GlobalLoader';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ProtectedRoute from './components/ProtectedRoute';
import api, { setLoaderHandler } from './api/axios';

const LoaderInitializer = () => {
  const { showLoader, hideLoader } = useLoader();

  React.useEffect(() => {
    setLoaderHandler({
      show: showLoader,
      hide: hideLoader
    });
  }, [showLoader, hideLoader]);

  return <GlobalLoader />;
};

function App() {
  return (
    <ThemeProvider>
      <LoaderProvider>
      <LoaderInitializer />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Router>
      </AuthProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
