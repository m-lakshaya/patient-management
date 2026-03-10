import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    MessageSquare,
    Users,
    History,
    TrendingUp,
    Loader2,
    ArrowRight,
    Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StaffDashboard() {
    const { profile } = useAuth()
    const [stats, setStats] = useState({
        totalQueries: 0,
        openQueries: 0,
        totalQueries: 0,
        openQueries: 0,
        pendingAppointments: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const [queries, open, appointments] = await Promise.all([
                    supabase.from('queries').select('*', { count: 'exact', head: true }),
                    supabase.from('queries').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
                ])

                setStats({
                    totalQueries: queries.count || 0,
                    openQueries: open.count || 0,
                    pendingAppointments: appointments.count || 0
                })
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>

    const staffCards = [
        { label: 'Pending Appointments', value: stats.pendingAppointments, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50', link: '/staff/appointments' },
        { label: 'Open Queries', value: stats.openQueries, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', link: '/staff/queries' },
        { label: 'Total Inquiries', value: stats.totalQueries, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/staff/queries' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Staff Control Center</h2>
                <p className="text-slate-500 mt-1">Monitor patient queries and manage medical records effectively.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {staffCards.map((card) => (
                    <Link
                        key={card.label}
                        to={card.link}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                    </Link>
                ))}
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100">
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Manage Patient Queries</h3>
                    <p className="text-blue-100 max-w-md">There are currently {stats.openQueries} queries waiting for a response. Your timely assistance helps improve patient care.</p>
                </div>
                <Link
                    to="/staff/queries"
                    className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all whitespace-nowrap"
                >
                    View All Queries
                </Link>
            </div>
        </div>
    )
}
