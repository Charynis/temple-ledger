import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import History from './components/History'

export default function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'history'

  useEffect(() => {
    const s = supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Temple Ledger</h1>
          <div className="flex gap-2 items-center">
            <button onClick={() => setView('dashboard')} className={`px-3 py-1 rounded ${view==='dashboard' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Dashboard</button>
            <button onClick={() => setView('history')} className={`px-3 py-1 rounded ${view==='history' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>History</button>
            <button onClick={async ()=>{ await supabase.auth.signOut(); window.location.reload(); }} className="px-3 py-1 rounded bg-red-500 text-white">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {view === 'dashboard' ? <Dashboard /> : <History />}
      </main>
    </div>
  )
}