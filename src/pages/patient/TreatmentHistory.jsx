import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    Search,
    Filter,
    Download,
    FileText,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Stethoscope
} from 'lucide-react'

export default function TreatmentHistory() {
    const { profile } = useAuth()
    const [treatments, setTreatments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const itemsPerPage = 8

    useEffect(() => {
        async function fetchTreatments() {
            if (!profile) return

            try {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('user_id', profile.id)
                    .single()

                if (!patientData) return

                const { data } = await supabase
                    .from('treatments')
                    .select(`
            *,
            doctors (name, specialization)
          `)
                    .eq('patient_id', patientData.id)
                    .order('treatment_date', { ascending: false })

                setTreatments(data || [])
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchTreatments()
    }, [profile])

    const filteredTreatments = treatments.filter(t =>
        t.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
        t.doctors?.name?.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filteredTreatments.length / itemsPerPage)
    const paginatedTreatments = filteredTreatments.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Treatment History</h2>
                    <p className="text-slate-500">View and track all your medical diagnoses and prescriptions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                    <Download className="w-4 h-4" />
                    Export All
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by diagnosis or doctor..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-transparent">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prescription</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedTreatments.length > 0 ? (
                                paginatedTreatments.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-900 font-medium">
                                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                {new Date(t.treatment_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 font-bold">{t.doctors?.name}</span>
                                                <span className="text-xs text-slate-500">{t.doctors?.specialization}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                                                {t.diagnosis}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 line-clamp-1 italic">"{t.prescription}"</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all">
                                                <FileText className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Stethoscope className="w-12 h-12 text-slate-200 mb-2" />
                                            <p className="text-slate-500">No treatment records found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing <span className="text-slate-900">{((page - 1) * itemsPerPage) + 1}</span> to <span className="text-slate-900">{Math.min(page * itemsPerPage, filteredTreatments.length)}</span> of <span className="text-slate-900">{filteredTreatments.length}</span> results
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${page === i + 1
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'hover:bg-white text-slate-600'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
