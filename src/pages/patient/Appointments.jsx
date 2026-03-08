import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Plus,
    Loader2,
    ArrowRight,
    Stethoscope,
    X,
    CheckCircle2,
    Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { withTimeout } from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function Appointments() {
    const { profile } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [patientId, setPatientId] = useState(null)

    // Form State
    const [selectedDoctor, setSelectedDoctor] = useState('')
    const [appointmentDate, setAppointmentDate] = useState('')
    const [appointmentTime, setAppointmentTime] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        async function fetchAppointments() {
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
                setPatientId(patientData.id)

                const [apptsRes, docsRes] = await Promise.allSettled([
                    withTimeout(supabase.from('appointments').select('*, doctors(name, specialization)').eq('patient_id', patientData.id).order('appointment_date', { ascending: false }), 5000),
                    withTimeout(supabase.from('doctors').select('*').order('name'), 5000)
                ])

                if (apptsRes.status === 'fulfilled') setAppointments(apptsRes.value.data || [])
                if (docsRes.status === 'fulfilled') setDoctors(docsRes.value.data || [])
            } catch (error) {
                console.error('Appointments Init Error:', error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAppointments()
    }, [profile])

    const fetchAppointmentsOnly = async (pid) => {
        try {
            const { data, error } = await withTimeout(
                supabase.from('appointments').select('*, doctors(name, specialization)').eq('patient_id', pid).order('appointment_date', { ascending: false }),
                5000
            )
            if (error) throw error
            setAppointments(data || [])
        } catch (err) {
            console.error('Fetch Appointments Error:', err)
        }
    }

    const handleRequestAppointment = async (e) => {
        e.preventDefault()
        if (!selectedDoctor || !appointmentDate || !appointmentTime || !patientId) {
            toast.error('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        try {
            const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`
            const { error } = await withTimeout(
                supabase.from('appointments').insert({
                    patient_id: patientId,
                    doctor_id: selectedDoctor,
                    appointment_date: appointmentDateTime,
                    notes: notes,
                    status: 'scheduled'
                }),
                10000,
                'Request Appointment'
            )

            if (error) throw error

            toast.success('Appointment requested successfully!')
            setIsModalOpen(false)
            // Reset form
            setSelectedDoctor('')
            setAppointmentDate('')
            setAppointmentTime('')
            setNotes('')
            // Refresh list
            fetchAppointmentsOnly(patientId)
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
                    <h2 className="text-2xl font-bold text-slate-900">Your Appointments</h2>
                    <p className="text-slate-500">Track and manage your upcoming consultations.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="w-4 h-4" />
                    Request Appointment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                ) : appointments.length > 0 ? (
                    appointments.map(appt => (
                        <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${appt.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                                    appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                        'bg-red-50 text-red-700'
                                    }`}>
                                    {appt.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Consultant</p>
                                    <p className="font-bold text-slate-900 text-lg">{appt.doctors?.name}</p>
                                    <p className="text-sm text-slate-500">{appt.doctors?.specialization}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                                            {new Date(appt.appointment_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {appt.notes && (
                                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-500 text-xs">
                                    "{appt.notes}"
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100">
                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium text-lg">No appointments scheduled.</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Book your next consultation with one of our specialized doctors today.</p>
                    </div>
                )}
            </div>

            {/* Request Appointment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                            <h3 className="text-xl font-bold text-slate-900">Request Appointment</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleRequestAppointment} className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Select Doctor</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none outline-none"
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">Choose a specialist...</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.name} ({doc.specialization})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Preferred Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Preferred Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        value={appointmentTime}
                                        onChange={(e) => setAppointmentTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Reason / Notes</label>
                                <textarea
                                    rows="3"
                                    placeholder="Briefly describe the purpose of your visit..."
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <button
                                disabled={submitting}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
