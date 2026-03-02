import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, profile, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && !allowedRoles.includes(profile?.role)) {
        // Redirect to their own dashboard if they try to access unauthorized area
        const dashboardPath = profile?.role ? `/${profile.role}/dashboard` : '/login'
        return <Navigate to={dashboardPath} replace />
    }

    return children
}
