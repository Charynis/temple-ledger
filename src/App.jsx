import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import History from './components/History'
import ResetPasswordCallback from './components/ResetPasswordCallback'
import { IoLogOutSharp } from "react-icons/io5";
import { GoHistory, GoHome } from "react-icons/go";

export default function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('loading') // 'loading' | 'login' | 'dashboard' | 'history' | 'reset-password'

  useEffect(() => {
    const checkSession = async () => {
    // Check for Supabase recovery token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1)) // remove '#' from start
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    // console.log("URL.. ", hashParams)
      // If Supabase sent us a recovery link Go to Reset password view
      if (accessToken && type === 'recovery') {
        setView('reset-password')
        return
      }

      // Otherwise check session
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setSession(data.session)
        setView('dashboard')
      } else {
        setView('login')
      }

      // Listen for login/logout
      const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
        setSession(sess)
        setView(sess ? 'dashboard' : 'login')
      })

      return () => {
        listener?.subscription?.unsubscribe?.()
      }
    }

    checkSession()
  }, [])

  // While loading session / checking URL
  if (view === 'loading') return <p className="text-center p-4">Loading...</p>

  // Show reset password screen
  if (view === 'reset-password') {
    return <ResetPasswordCallback setView={setView} />
  }

  // Show login screen
  if (!session || view === 'login') {
    return <Auth setView={setView} />
  }

  // Show main layout (dashboard/history)
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Temple Ledger</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1 rounded ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              <GoHome />
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-3 py-1 rounded ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              <GoHistory />
            </button>
            <button
              onClick={async () => {
                if (!confirm('Are sure to Logout?')) return
                await supabase.auth.signOut()
                setSession(null)
                setView('login')
              }}
              className="px-3 py-1 rounded bg-red-500 text-white"
            >
            <IoLogOutSharp />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {view === 'dashboard' ? <Dashboard /> : <History />}
      </main>
    </div>
  )
}