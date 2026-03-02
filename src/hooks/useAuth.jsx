import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('AuthProvider: Initializing...')

        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), ms)
        )

        const getSession = async () => {
            try {
                console.log('AuthProvider: Fetching session...')
                // Race getSession against a 5s timeout
                const { data: { session } } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise(5000)
                ])

                console.log('AuthProvider: Session data received:', session?.user?.id || 'No user')
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user)
                }
            } catch (err) {
                console.warn('AuthProvider: Session fetch timed out or failed:', err.message)
            } finally {
                setLoading(false)
                console.log('AuthProvider: Loading finished.')
            }
        }

        const fetchProfile = async (currentUser) => {
            try {
                console.log('AuthProvider: Fetching profile for:', currentUser.id)
                const { data, error } = await Promise.race([
                    supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
                    timeoutPromise(5000)
                ])

                if (error) throw error
                console.log('AuthProvider: Profile loaded.')
                setProfile(data)
            } catch (err) {
                console.warn('AuthProvider: Profile fetch failed, using metadata fallback.')
                setProfile({ role: currentUser.user_metadata?.role || 'patient' })
            }
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('AuthProvider: Auth Event:', _event)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut: () => supabase.auth.signOut() }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
