import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../supabaseClient'
import {
    Calendar,
    History,
    MessageSquare,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PatientDashboard() {
    const { profile } = useAuth()
    const [stats, setStats] = useState({
        appointments: 0,
        treatments: 0,
        queries: 0
    })
    const [recentActivity, setRecentActivity] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            if (!profile) return

            try {
                // Fetch Patient ID first
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('user_id', profile.id)
                    .single()

                if (!patientData) return

                const patientId = patientData.id

                // Fetch counts
                const [appts, treats, queries] = await Promise.all([
                    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('patient_id', patientId),
                    supabase.from('treatments').select('*', { count: 'exact', head: true }).eq('patient_id', patientId),
                    supabase.from('queries').select('*', { count: 'exact', head: true }).eq('patient_id', patientId)
                ])

                setStats({
                    appointments: appts.count || 0,
                    treatments: treats.count || 0,
                    queries: queries.count || 0
                })

                // Fetch recent appointments as activity
                const { data: latestAppts } = await supabase
                    .from('appointments')
                    .select(`
            id,
            appointment_date,
            status,
            doctors (name, specialization)
          `)
                    .eq('patient_id', patientId)
                    .order('appointment_date', { ascending: false })
                    .limit(5)

                setRecentActivity(latestAppts || [])
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [profile])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    const statCards = [
        { label: 'Total Appointments', value: stats.appointments, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', link: '/patient/appointments' },
        { label: 'Total Treatments', value: stats.treatments, icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/patient/treatments' },
        { label: 'Open Queries', value: stats.queries, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', link: '/patient/queries' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.full_name}</h2>
                <p className="text-slate-500 mt-1">Here is what's happening with your health profile today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <Link
                        key={stat.label}
                        to={stat.link}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </Link>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Recent Appointments</h3>
                    <Link to="/patient/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <div key={activity.id} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                <div className={`p-2 rounded-full ${activity.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                        activity.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {activity.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                        activity.status === 'cancelled' ? <X className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">
                                        Consultation with {activity.doctors?.name || 'Doctor'}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {activity.doctors?.specialization} • {new Date(activity.appointment_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${activity.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                            activity.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-full mb-4">
                                <Calendar className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No recent appointments found.</p>
                            <Link to="/patient/appointments" className="text-blue-600 text-sm font-bold mt-2 inline-block">Book your first appointment</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
