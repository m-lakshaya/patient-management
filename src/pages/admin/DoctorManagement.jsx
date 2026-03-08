import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
    Stethoscope,
    Plus,
    Trash2,
    Mail,
    Phone,
    User,
    Loader2,
    X,
    Search,
    Edit2
} from 'lucide-react'
import { withTimeout } from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function DoctorManagement() {
    const [doctors, setDoctors] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form State for Adding/Editing
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        phone: '',
        email: ''
    })

    useEffect(() => {
        fetchDoctors()
    }, [])

    async function fetchDoctors() {
        setLoading(true)
        try {
            const { data, error } = await withTimeout(
                supabase.from('doctors').select('*').order('name'),
                5000,
                'Doctors Fetch'
            )
            if (error) throw error
            setDoctors(data || [])
        } catch (error) {
            toast.error('Failed to load doctors')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (editingId) {
                const { error } = await withTimeout(
                    supabase.from('doctors').update(formData).eq('id', editingId),
                    10000,
                    'Doctor Update'
                )
                if (error) throw error
                toast.success('Doctor updated successfully')
            } else {
                const { error } = await withTimeout(
                    supabase.from('doctors').insert(formData),
                    10000,
                    'Doctor Insert'
                )
                if (error) throw error
                toast.success('Doctor added successfully')
            }
            setIsModalOpen(false)
            resetForm()
            fetchDoctors()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to remove this doctor?')) return
        try {
            const { error } = await withTimeout(
                supabase.from('doctors').delete().eq('id', id),
                5000,
                'Doctor Delete'
            )
            if (error) throw error
            toast.success('Doctor removed')
            fetchDoctors()
        } catch (error) {
            toast.error(error.message)
        }
    }

    function openEditModal(doctor) {
        setEditingId(doctor.id)
        setFormData({
            name: doctor.name,
            specialization: doctor.specialization,
            phone: doctor.phone || '',
            email: doctor.email || ''
        })
        setIsModalOpen(true)
    }

    function resetForm() {
        setEditingId(null)
        setFormData({
            name: '',
            specialization: '',
            phone: '',
            email: ''
        })
    }

    const filteredDoctors = doctors.filter(d =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Medical Staff Management</h2>
                    <p className="text-slate-500">Add and manage doctors available for patient appointments.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="w-4 h-4" />
                    Add New Doctor
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or specialization..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
                ) : filteredDoctors.length > 0 ? (
                    filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(doctor)}
                                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doctor.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{doctor.name}</h3>
                                    <p className="text-sm font-medium text-blue-600">{doctor.specialization}</p>
                                </div>

                                <div className="pt-4 border-t border-slate-50 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Mail className="w-4 h-4" />
                                        {doctor.email || 'No email provided'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Phone className="w-4 h-4" />
                                        {doctor.phone || 'No phone provided'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100">
                        <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium text-lg">No doctors found.</p>
                        <p className="text-sm text-slate-400 mt-1">Start by adding your first medical professional.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg relative overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                            <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Full Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Specialization</label>
                                <input
                                    required
                                    placeholder="e.g. Cardiologist"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.specialization}
                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Phone</label>
                                <input
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <button
                                disabled={submitting}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {editingId ? 'Update Doctor' : 'Add Doctor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
