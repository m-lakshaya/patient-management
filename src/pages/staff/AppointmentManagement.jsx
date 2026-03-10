import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    Filter,
    Stethoscope,
    AlertCircle,
    X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AppointmentManagement() {
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')

    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [treatmentData, setTreatmentData] = useState({ diagnosis: '', prescription: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchAppointments()
    }, [])

    async function fetchAppointments() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients (
                        id,
                        profiles (full_name, email)
                    ),
                    doctors (name, specialization)
                `)
                .order('appointment_date', { ascending: false })

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            toast.error('Failed to load appointments')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function updateStatus(id, newStatus) {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
            toast.success(`Appointment marked as ${newStatus}`)
            fetchAppointments()
        } catch (error) {
            toast.error(error.message)
        }
    }

    async function handleCompleteAppointment(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            // 1. Update appointment status
            const { error: apptError } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', selectedAppointment.id)
            if (apptError) throw apptError

            // 2. Insert treatment record
            const { error: treatmentError } = await supabase
                .from('treatments')
                .insert({
                    patient_id: selectedAppointment.patient_id,
                    doctor_id: selectedAppointment.doctor_id,
                    diagnosis: treatmentData.diagnosis,
                    prescription: treatmentData.prescription,
                    treatment_date: new Date().toISOString()
                })
            if (treatmentError) throw treatmentError

            toast.success('Appointment completed and treatment logged!')
            setIsTreatmentModalOpen(false)
            setSelectedAppointment(null)
            setTreatmentData({ diagnosis: '', prescription: '' })
            fetchAppointments()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const filteredAppointments = appointments.filter(appt => {
        // If search is empty, show everything (don't let null joins hide records)
        if (!search) {
            const matchesFilter = filter === 'all' || appt.status === filter
            return matchesFilter
        }

        const patientName = appt.patients?.profiles?.full_name?.toLowerCase() || ''
        const doctorName = appt.doctors?.name?.toLowerCase() || ''
        const searchLower = search.toLowerCase()

        const matchesSearch = patientName.includes(searchLower) || doctorName.includes(searchLower)
        const matchesFilter = filter === 'all' || appt.status === filter

        return matchesSearch && matchesFilter
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Appointment Requests</h2>
                    <p className="text-slate-500">Review and manage patient consultation schedules.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by patient or doctor..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center bg-white px-4 rounded-2xl border border-slate-100 shadow-sm min-w-[200px]">
                    <Filter className="w-5 h-5 text-slate-400 mr-3" />
                    <select
                        className="bg-transparent border-none outline-none w-full py-4 text-sm font-bold text-slate-700 cursor-pointer"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="scheduled">Scheduled (Pending)</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Doctor / Specialist</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></td></tr>
                            ) : filteredAppointments.length > 0 ? (
                                filteredAppointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {appt.patients?.profiles?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{appt.patients?.profiles?.full_name}</p>
                                                    <p className="text-xs text-slate-500">{appt.patients?.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Stethoscope className="w-4 h-4 text-blue-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{appt.doctors?.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{appt.doctors?.specialization}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    {new Date(appt.appointment_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                    {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${appt.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                                                appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {appt.status === 'scheduled' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAppointment(appt)
                                                                setIsTreatmentModalOpen(true)
                                                            }}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Complete Appointment and Log Treatment"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(appt.id, 'cancelled')}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Cancel Appointment"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No appointments found matching your criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Treatment Modal */}
            {isTreatmentModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTreatmentModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Log Treatment Details</h3>
                            <button onClick={() => setIsTreatmentModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <form onSubmit={handleCompleteAppointment} className="p-8 space-y-6">
                            <div className="p-4 bg-blue-50 rounded-xl mb-4 text-left">
                                <p className="text-sm text-blue-800 font-medium tracking-tight">
                                    You are completing the appointment for <strong className="font-extrabold">{selectedAppointment?.patients?.profiles?.full_name}</strong>.
                                    This will log a permanent medical record.
                                </p>
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-slate-900"
                                    placeholder="e.g., Viral infection, Seasonal allergies..."
                                    value={treatmentData.diagnosis}
                                    onChange={e => setTreatmentData({ ...treatmentData, diagnosis: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-sm font-bold text-slate-700">Prescription / Notes</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-slate-900"
                                    placeholder="Medications and dosage instructions..."
                                    value={treatmentData.prescription}
                                    onChange={e => setTreatmentData({ ...treatmentData, prescription: e.target.value })}
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTreatmentModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete & Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
