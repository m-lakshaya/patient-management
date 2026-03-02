import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    Droplet,
    Loader2,
    ChevronRight
} from 'lucide-react'

export default function PatientList() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchPatients()
    }, [])

    async function fetchPatients() {
        setLoading(true)
        const { data } = await supabase
            .from('patients')
            .select(`
        *,
        profiles (full_name, email)
      `)
        setPatients(data || [])
        setLoading(false)
    }

    const filteredPatients = patients.filter(p =>
        p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.profiles?.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Patient Directory</h2>
                <p className="text-slate-500">Access and manage comprehensive patient information.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                ) : filteredPatients.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner">
                                {p.profiles?.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 truncate">{p.profiles?.full_name}</h3>
                                <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> {p.profiles?.email}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</span>
                                <span className="text-slate-700 font-bold">{p.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2"><Droplet className="w-4 h-4 text-red-400" /> Blood Group</span>
                                <span className="text-slate-700 font-bold">{p.blood_group || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</span>
                                <span className="text-slate-700 font-bold truncate max-w-[150px]">{p.address || 'N/A'}</span>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-between p-3 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl text-xs font-bold transition-all text-slate-600">
                            View Medical Records
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
