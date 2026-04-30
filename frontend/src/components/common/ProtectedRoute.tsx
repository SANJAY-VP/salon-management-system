import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
    allowedRoles?: ('customer' | 'barber')[];
}
// change to modern framework
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user, token, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-cocoa opacity-50" />
                <div className="relative z-10">
                    <LoadingSpinner size="lg" label="Loading session" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to={user.role === 'barber' ? '/barber/dashboard' : '/home'} replace />;
    }

    return <Outlet />; // render the route here, if access is allowed
};

export default ProtectedRoute;
