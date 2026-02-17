import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoaderProvider, useLoader } from './context/LoaderContext';
import GlobalLoader from './components/GlobalLoader';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
    <LoaderProvider>
      <LoaderInitializer />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
  );
}

export default App;
