import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
    BarChart3,
    TrendingUp,
    Users,
    Activity,
    History,
    Loader2,
    Calendar
} from 'lucide-react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        treatments: 0,
        queries: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const [p, d, t, q] = await Promise.all([
                supabase.from('patients').select('*', { count: 'exact', head: true }),
                supabase.from('doctors').select('*', { count: 'exact', head: true }),
                supabase.from('treatments').select('*', { count: 'exact', head: true }),
                supabase.from('queries').select('*', { count: 'exact', head: true })
            ])
            setStats({
                patients: p.count || 0,
                doctors: d.count || 0,
                treatments: t.count || 0,
                queries: q.count || 0
            })
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>

    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Treatments Provided',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.5)',
                tension: 0.4
            }
        ]
    }

    const barData = {
        labels: ['Completed', 'Pending', 'Scheduled'],
        datasets: [
            {
                label: 'Appointments Status',
                data: [65, 59, 80],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(37, 99, 235, 0.6)'
                ],
                borderRadius: 8
            }
        ]
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">System Analytics</h2>
                <p className="text-slate-500 mt-1">Global overview of clinical activity and user growth.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Patients', value: stats.patients, icon: Users, color: 'bg-blue-600' },
                    { label: 'Total Doctors', value: stats.doctors, icon: Activity, color: 'bg-emerald-600' },
                    { label: 'Treatments', value: stats.treatments, icon: History, color: 'bg-indigo-600' },
                    { label: 'Open Queries', value: stats.queries, icon: BarChart3, color: 'bg-amber-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-slate-100`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Treatment Trends
                    </h3>
                    <div className="h-64">
                        <Line data={lineData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        Appointment Distribution
                    </h3>
                    <div className="h-64">
                        <Bar data={barData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
