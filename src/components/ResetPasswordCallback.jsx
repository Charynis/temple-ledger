import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ResetPasswordCallback({ setView }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase handles the session automatically when the reset link is clicked
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords don't match.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password reset successful! Redirecting to login...')
      setTimeout(() => {
        setView('login') // go back to login view
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Reset Your Password</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          {message && <p className="text-sm text-red-600">{message}</p>}
        </form>
      </div>
    </div>
  )
}
