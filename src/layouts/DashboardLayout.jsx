import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
    LayoutDashboard,
    History,
    Calendar,
    FileText,
    MessageSquare,
    Users,
    Stethoscope,
    BarChart3,
    LogOut,
    Menu,
    X,
    User as UserIcon
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { profile, signOut } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const roleConfigs = {
        patient: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/patient/dashboard' },
            { name: 'Treatments', icon: History, path: '/patient/treatments' },
            { name: 'Appointments', icon: Calendar, path: '/patient/appointments' },
            { name: 'Reports', icon: FileText, path: '/patient/reports' },
            { name: 'Queries', icon: MessageSquare, path: '/patient/queries' },
        ],
        staff: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
            { name: 'Manage Queries', icon: MessageSquare, path: '/staff/queries' },
            { name: 'Manage Treatments', icon: History, path: '/staff/treatments' },
            { name: 'Patients', icon: Users, path: '/staff/patients' },
        ],
        admin: [
            { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            { name: 'Manage Users', icon: Users, path: '/admin/users' },
            { name: 'Doctors', icon: Stethoscope, path: '/admin/doctors' },
            { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
        ],
    }

    const menuItems = roleConfigs[profile?.role] || []

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Stethoscope className="text-white w-5 h-5" />
                            </div>
                            <span className="font-bold text-xl text-slate-900">HealthDesk</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                            <X className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium",
                                    location.pathname === item.path
                                        ? "bg-blue-50 text-blue-600 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-blue-600" : "text-slate-400")} />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile Area */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name}</p>
                                <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all font-medium group"
                        >
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-500"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 px-4">
                        <h1 className="text-lg font-bold text-slate-900">
                            {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Additional header items like notifications could go here */}
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    )
}
