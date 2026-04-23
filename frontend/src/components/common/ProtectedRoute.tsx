import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';

interface ProtectedRouteProps {
    allowedRoles?: ('customer' | 'barber')[];
}
// change to modern framework
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user, token, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-[#D4AF37] font-serif tracking-[0.2em] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-cocoa opacity-50" />
                <div className="relative animate-pulse flex flex-col items-center gap-6">
                    <div className="w-16 h-px bg-gold/50" />
                    <span className="text-xl">ELEVATING</span>
                    <div className="w-16 h-px bg-gold/50" />
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
