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
    Stethoscope
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { withTimeout } from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function Appointments() {
    const { profile } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)

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

                const { data, error } = await withTimeout(
                    supabase.from('appointments').select('*, doctors(name, specialization)').eq('patient_id', patientData.id).order('appointment_date', { ascending: false }),
                    5000,
                    'Appointments Fetch'
                )

                if (error) throw error
                setAppointments(data || [])
            } catch (error) {
                console.error('Appointments Error:', error.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAppointments()
    }, [profile])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Appointments</h2>
                    <p className="text-slate-500">Track and manage your upcoming consultations.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
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
                        <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium text-lg">No appointments scheduled.</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Book your next consultation with one of our specialized doctors today.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
