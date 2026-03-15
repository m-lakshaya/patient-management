import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    // Refs to avoid stale closures in onAuthStateChange
    const currentUserIdRef = useRef(null)
    const profileRef = useRef(null)

    useEffect(() => {
        const timeoutPromise = (ms) => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), ms)
        )

        const fetchProfile = async (currentUser) => {
            try {
                console.log('AuthProvider: Fetching profile for:', currentUser.id)
                const { data, error } = await Promise.race([
                    supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
                    timeoutPromise(10000)
                ])

                if (error) throw error
                console.log('AuthProvider: Profile loaded successfully:', data?.role)
                profileRef.current = data
                setProfile(data)
            } catch (err) {
                console.error('AuthProvider: Profile fetch error:', err)
                profileRef.current = null
                setProfile(null)
            }
        }

        const initializeAuth = async () => {
            try {
                console.log('AuthProvider: Initializing...')
                const { data: { session } } = await supabase.auth.getSession()
                
                if (session?.user) {
                    console.log('AuthProvider: Initial session found:', session.user.id)
                    setUser(session.user)
                    currentUserIdRef.current = session.user.id
                    await fetchProfile(session.user)
                } else {
                    console.log('AuthProvider: No initial session.')
                    setUser(null)
                    setProfile(null)
                    currentUserIdRef.current = null
                    profileRef.current = null
                }
            } catch (err) {
                console.error('AuthProvider: Init error:', err)
            } finally {
                setLoading(false)
                console.log('AuthProvider: Loading finished.')
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthProvider: Auth Event:', event)
            const newUser = session?.user ?? null
            
            // Skip logic during initial load as initializeAuth handles it
            if (event === 'INITIAL_SESSION') return

            if (!newUser) {
                currentUserIdRef.current = null
                profileRef.current = null
                setUser(null)
                setProfile(null)
                setLoading(false)
                return
            }

            setUser(newUser)

            // Re-fetch only if user ID changes or if we have NO profile data at all
            if (newUser.id !== currentUserIdRef.current || !profileRef.current) {
                console.log('AuthProvider: Resolving profile on event:', event)
                currentUserIdRef.current = newUser.id
                setLoading(true)
                await fetchProfile(newUser)
                setLoading(false)
            }
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
