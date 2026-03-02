import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
    Users,
    Search,
    Shield,
    UserMinus,
    MoreVertical,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        setUsers(data || [])
        setLoading(false)
    }

    async function updateRole(userId, newRole) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error
            toast.success(`Role updated to ${newRole}`)
            fetchUsers()
        } catch (error) {
            toast.error(error.message)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                <p className="text-slate-500">Manage system access and assign roles to users.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Current Role</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="3" className="py-20 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></td></tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold">
                                                {u.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{u.full_name}</p>
                                                <p className="text-sm text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' :
                                                u.role === 'staff' ? 'bg-amber-50 text-amber-700' :
                                                    'bg-emerald-50 text-emerald-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <select
                                                className="text-xs font-bold bg-slate-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                value={u.role}
                                                onChange={(e) => updateRole(u.id, e.target.value)}
                                            >
                                                <option value="patient">Patient</option>
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                <UserMinus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
