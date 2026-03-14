import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SalesDashboard from './pages/SalesDashboard';
import ViewOrders from './pages/ViewOrders';
import OrderDetails from './pages/OrderDetails';
import Retailers from './pages/Retailers';
import CreateOrder from './pages/CreateOrder';
import MyDeliveries from './pages/MyDeliveries';
import DeliveryDetails from './pages/DeliveryDetails';
import DriverDashboard from './pages/DriverDashboard';
import CollectPayment from './pages/CollectPayment';
import PaymentHistory from './pages/PaymentHistory';
import CollectionDashboard from './pages/CollectionDashboard';
import InvoiceView from './pages/InvoiceView';
import Unauthorized from './pages/Unauthorized';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

import { LoaderProvider, useLoader } from './context/LoaderContext';
import GlobalLoader from './components/GlobalLoader';
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

const HomeRedirect = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'sales_rep': return <Navigate to="/sales-dashboard" replace />;
    case 'driver': return <Navigate to="/driver-dashboard" replace />;
    case 'collection_agent': return <Navigate to="/collection-dashboard" replace />;
    case 'admin': return <div className="p-10 text-center">Admin should use the Admin Portal</div>;
    default: return <Navigate to="/login" replace />;
  }
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
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/" element={<HomeRedirect />} />

            <Route
              path="/sales-dashboard"
              element={
                <ProtectedRoute allowedRoles={['sales_rep']}>
                  <SalesDashboard />
                </ProtectedRoute>
              }
            />
            {/* ... rest of the routes ... */}
            <Route
              path="/view-orders"
              element={
                <ProtectedRoute allowedRoles={['sales_rep']}>
                  <ViewOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['sales_rep']}>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/retailers"
              element={
                <ProtectedRoute allowedRoles={['sales_rep', 'driver', 'collection_agent']}>
                  <Retailers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-order"
              element={
                <ProtectedRoute allowedRoles={['sales_rep', 'driver']}>
                  <CreateOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver-dashboard"
              element={
                <ProtectedRoute allowedRoles={['driver']}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-deliveries"
              element={
                <ProtectedRoute allowedRoles={['driver', 'collection_agent']}>
                  <MyDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/:id"
              element={
                <ProtectedRoute allowedRoles={['driver', 'collection_agent']}>
                  <DeliveryDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collection-dashboard"
              element={
                <ProtectedRoute allowedRoles={['collection_agent', 'sales_rep', 'driver']}>
                  <CollectionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collect-payment"
              element={
                <ProtectedRoute allowedRoles={['collection_agent', 'driver', 'sales_rep']}>
                  <CollectPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice/:id"
              element={
                <ProtectedRoute allowedRoles={['collection_agent', 'sales_rep', 'driver']}>
                  <InvoiceView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute allowedRoles={['collection_agent', 'driver', 'sales_rep']}>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['sales_rep', 'driver', 'collection_agent']}>
                  <Profile />
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
