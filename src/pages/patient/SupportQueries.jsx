import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    MessageSquare,
    Plus,
    Clock,
    CheckCircle2,
    HelpCircle,
    Loader2,
    X,
    Calendar as CalendarIcon
} from 'lucide-react'
import { withTimeout } from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function SupportQueries() {
    const { profile } = useAuth()
    const [queries, setQueries] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [patientId, setPatientId] = useState(null)

    useEffect(() => {
        async function fetchQueries() {
            if (!profile?.id) {
                setLoading(false)
                return
            }

            try {
                const { data: patientData, error: patientError } = await withTimeout(
                    supabase.from('patients').select('id').eq('user_id', profile.id).single(),
                    5000,
                    'Patient Lookup'
                )

                if (patientError || !patientData) {
                    setLoading(false)
                    return
                }
                setPatientId(patientData.id) // Keep this to set patientId for handleSubmit

                const { data, error } = await withTimeout(
                    supabase.from('queries').select('*').eq('patient_id', patientData.id).order('created_at', { ascending: false }),
                    5000,
                    'Queries Fetch'
                )

                if (error) throw error
                setQueries(data || [])
            } catch (error) {
                console.error('Queries Error:', error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchQueries()
    }, [profile])

    // Re-introduce a separate fetchQueries function if it's called outside useEffect,
    // or modify handleSubmit to use the logic directly.
    // For now, assuming handleSubmit will call a simplified version or rely on patientId state.
    async function refetchQueries(id) {
        setLoading(true)
        try {
            const { data, error } = await withTimeout(
                supabase.from('queries').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
                5000,
                'Queries Refetch'
            )
            if (error) throw error
            setQueries(data || [])
        } catch (error) {
            console.error('Refetch Queries Error:', error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            const { error } = await supabase.from('queries').insert({
                patient_id: patientId,
                subject,
                description,
                status: 'open'
            })
            if (error) throw error
            toast.success('Query raised successfully')
            setIsModalOpen(false)
            setSubject('')
            setDescription('')
            refetchQueries(patientId)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Support Queries</h2>
                    <p className="text-slate-500">Raise a ticket for any help you need regarding your treatment.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="w-4 h-4" />
                    Raise New Query
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                ) : queries.length > 0 ? (
                    queries.map((q) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 text-lg">{q.subject}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-slate-400 capitalize flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString()}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${q.status === 'open' ? 'bg-blue-50 text-blue-700' :
                                            q.status === 'in_progress' ? 'bg-amber-50 text-amber-700' :
                                                'bg-emerald-50 text-emerald-700'
                                            }`}>
                                            {(q.status || 'open').replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl">{q.description}</p>

                            {q.response && (
                                <div className="border-t border-slate-100 pt-6 mt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">H</div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-900">Hospital Response</p>
                                            <p className="text-sm text-slate-600 italic">"{q.response}"</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-16 rounded-2xl border border-dashed border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HelpCircle className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No queries yet</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Have concerns about your medication or reports? Raise a query and our staff will assist you.</p>
                    </div>
                )}
            </div>

            {/* Raise Query Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                            <h3 className="text-xl font-bold text-slate-900">Raise New Query</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Subject</label>
                                <input
                                    required
                                    placeholder="e.g., Question about my prescription"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Description</label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="Provide more details so our staff can help you better..."
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <button
                                disabled={submitting}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Submit Query
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
