import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { user, profile } = useAuth()

    // EFFECT: If background listener (useAuth) detects a session, redirect immediately
    useEffect(() => {
        if (user && profile) {
            console.log('Login: Background session detected, redirecting...', profile.role)
            redirectByRole(profile.role)
        }
    }, [user, profile])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        console.log('--- LOGIN START ---')

        try {
            console.log('Calling supabase.auth.signInWithPassword...')

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth call timeout')), 5000)
            )

            // Race the auth call against a 5s timeout
            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                timeoutPromise
            ])

            if (error) {
                console.error('--- LOGIN FAILED ---', error.message)
                toast.error(error.message || 'Invalid login credentials')
                setLoading(false)
                return
            }

            console.log('--- AUTH CALL SUCCESSFUL ---')
            toast.success('Signed in successfully!')
            // Note: The redirection is still handled by the useEffect background listener
            // once useAuth detects the new session and fetches the profile.

        } catch (error) {
            console.error('--- LOGIN CAUGHT EXCEPTION ---', error)
            toast.error(error.message || 'An unexpected error occurred')
            setLoading(false)
        }
    }

    const redirectByRole = (role) => {
        if (role === 'admin') navigate('/admin/dashboard')
        else if (role === 'staff') navigate('/staff/dashboard')
        else navigate('/patient/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <LogIn className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                    <p className="mt-2 text-slate-500">Please enter your details to sign in</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="text-sm font-medium text-slate-700 block mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5 mr-3" />
                        ) : null}
                        Sign in
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-slate-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                            Create a free account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
