import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
    History,
    Search,
    Plus,
    Edit,
    Loader2,
    Calendar,
    X,
    Stethoscope
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TreatmentManagement() {
    const [treatments, setTreatments] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTreatment, setEditingTreatment] = useState(null)

    // Form state
    const [patients, setPatients] = useState([])
    const [doctors, setDoctors] = useState([])
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        diagnosis: '',
        prescription: '',
        treatment_date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchTreatments()
        fetchFormData()
    }, [])

    async function fetchTreatments() {
        setLoading(true)
        const { data } = await supabase
            .from('treatments')
            .select(`
        *,
        patients (id, profiles(full_name)),
        doctors (name)
      `)
            .order('treatment_date', { ascending: false })
        setTreatments(data || [])
        setLoading(false)
    }

    async function fetchFormData() {
        const [pRes, dRes] = await Promise.all([
            supabase.from('patients').select('id, profiles(full_name)'),
            supabase.from('doctors').select('id, name')
        ])
        setPatients(pRes.data || [])
        setDoctors(dRes.data || [])
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const { patient_id, doctor_id, diagnosis, prescription, treatment_date } = formData

        try {
            if (editingTreatment) {
                const { error } = await supabase
                    .from('treatments')
                    .update({ diagnosis, prescription, treatment_date })
                    .eq('id', editingTreatment.id)
                if (error) throw error
                toast.success('Treatment updated')
            } else {
                const { error } = await supabase
                    .from('treatments')
                    .insert({ patient_id, doctor_id, diagnosis, prescription, treatment_date })
                if (error) throw error
                toast.success('Treatment added')
            }
            setIsModalOpen(false)
            setEditingTreatment(null)
            setFormData({ patient_id: '', doctor_id: '', diagnosis: '', prescription: '', treatment_date: new Date().toISOString().split('T')[0] })
            fetchTreatments()
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manage Treatments</h2>
                    <p className="text-slate-500">Record and update patient medical history.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTreatment(null)
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="w-4 h-4" />
                    Add New Treatment
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Doctor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Diagnosis</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-12 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></td></tr>
                            ) : treatments.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.treatment_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{t.patients?.profiles?.full_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.doctors?.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{t.diagnosis}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                setEditingTreatment(t)
                                                setFormData({
                                                    patient_id: t.patient_id,
                                                    doctor_id: t.doctor_id,
                                                    diagnosis: t.diagnosis,
                                                    prescription: t.prescription,
                                                    treatment_date: t.treatment_date.split('T')[0]
                                                })
                                                setIsModalOpen(true)
                                            }}
                                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Treatment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">{editingTreatment ? 'Edit Treatment' : 'Record New Treatment'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {!editingTreatment && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Patient</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.patient_id}
                                            onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                        >
                                            <option value="">Select Patient</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Doctor</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.doctor_id}
                                            onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                                        >
                                            <option value="">Select Doctor</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.treatment_date}
                                    onChange={e => setFormData({ ...formData, treatment_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                                <input
                                    required
                                    placeholder="e.g., Acute Migraine"
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.diagnosis}
                                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Prescription</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    value={formData.prescription}
                                    onChange={e => setFormData({ ...formData, prescription: e.target.value })}
                                />
                            </div>
                            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                                {editingTreatment ? 'Update Record' : 'Save Treatment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
