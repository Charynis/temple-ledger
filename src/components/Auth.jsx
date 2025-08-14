import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e){
    e.preventDefault(); setLoading(true); setMessage('')
    if(isRegister){
      const { data, error } = await supabase.auth.signUp({ email, password })
      if(error) setMessage(error.message)
      else setMessage('Registration successful. Check your email for confirmation (if enabled).')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-4">{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleLogin} className="space-y-3">
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" />
          <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e=>setIsRegister(e.target.checked)} /> Register</label>
            <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">{loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}</button>
          </div>
          {message && <p className="text-sm text-red-600">{message}</p>}
        </form>
      </div>
    </div>
  )
}