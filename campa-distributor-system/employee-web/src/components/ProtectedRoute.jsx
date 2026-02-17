import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) {
        // Don't capture dashboard URLs in redirect state to avoid profile mixups
        const isDashboard = ['/sales-dashboard', '/driver-dashboard', '/collection-dashboard'].includes(location.pathname);
        return <Navigate to="/login" state={isDashboard ? null : { from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
