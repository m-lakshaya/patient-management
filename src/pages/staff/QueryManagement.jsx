import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    User,
    Send
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function QueryManagement() {
    const { profile } = useAuth()
    const [queries, setQueries] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedQuery, setSelectedQuery] = useState(null)
    const [response, setResponse] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchQueries()
    }, [])

    async function fetchQueries() {
        setLoading(true)
        const { data } = await supabase
            .from('queries')
            .select(`
        *,
        patients (
          full_name:profiles(full_name),
          phone
        )
      `)
            .order('created_at', { ascending: false })
        setQueries(data || [])
        setLoading(false)
    }

    async function handleResponse(e) {
        e.preventDefault()
        if (!selectedQuery) return
        setSubmitting(true)

        try {
            const { error } = await supabase
                .from('queries')
                .update({
                    response,
                    status: 'resolved',
                    assigned_to: profile.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedQuery.id)

            if (error) throw error
            toast.success('Response sent and query resolved')
            setResponse('')
            setSelectedQuery(null)
            fetchQueries()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function assignToMe(queryId) {
        try {
            const { error } = await supabase
                .from('queries')
                .update({
                    assigned_to: profile.id,
                    status: 'in_progress',
                    updated_at: new Date().toISOString()
                })
                .eq('id', queryId)

            if (error) throw error
            toast.success('Query assigned to you')
            fetchQueries()
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Patient Queries</h2>
                    <p className="text-slate-500">Provide support and resolve patient inquiries here.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                ) : queries.length > 0 ? (
                    queries.map((q) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 hover:border-blue-200 transition-all">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${q.status === 'open' ? 'bg-blue-50 text-blue-700' :
                                            q.status === 'in_progress' ? 'bg-amber-50 text-amber-700' :
                                                'bg-emerald-50 text-emerald-700'
                                        }`}>
                                        {q.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{q.subject}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">"{q.description}"</p>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{q.patients?.profiles?.full_name || 'Anonymous Patient'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-3 lg:border-l lg:border-slate-100 lg:pl-6 min-w-[200px]">
                                {q.status === 'open' && (
                                    <button
                                        onClick={() => assignToMe(q.id)}
                                        className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all"
                                    >
                                        Assign to Me
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedQuery(q)
                                        setResponse(q.response || '')
                                    }}
                                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {q.response ? 'Update Response' : 'Respond Now'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
                        <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Clear! No pending queries found.</p>
                    </div>
                )}
            </div>

            {/* Response Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedQuery(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h3 className="text-xl font-bold text-slate-900">Respond to Query</h3>
                            <button onClick={() => setSelectedQuery(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Subject</p>
                                <p className="text-slate-900 font-bold">{selectedQuery.subject}</p>
                            </div>
                            <form onSubmit={handleResponse} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Your Response</label>
                                    <textarea
                                        required
                                        rows="5"
                                        placeholder="Type your professional response here..."
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner"
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                    />
                                </div>
                                <button
                                    disabled={submitting}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Send Response & Resolve
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
