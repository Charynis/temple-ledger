import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
const BASE_URL = import.meta.env.VITE_BASE_URL
console.log("BASE URL: ", BASE_URL)
export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Registration successful. Check your email for confirmation.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }

    setLoading(false)
  }

  async function handlePasswordReset(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!email) {
      setMessage('Please enter your email to reset your password.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: BASE_URL,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password reset email sent. Please check your inbox.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-4">
          {isResetting ? 'Reset Password' : 'Login'}
        </h2>

        <form onSubmit={isResetting ? handlePasswordReset : handleLogin} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded"
          />

          {!isResetting && (
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 border rounded"
            />
          )}

          <div className="flex justify-between items-center">
            {/* {!isResetting && (
              <label className="text-sm flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isRegister}
                  onChange={(e) => setIsRegister(e.target.checked)}
                />
                <span>Register</span>
              </label>
            )} */}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading
                ? 'Please wait...'
                : isResetting
                ? 'Send Reset Link'
                // : isRegister
                // ? 'Register'
                : 'Login'}
            </button>
          </div>

          <div className="text-sm text-right">
            <button
              type="button"
              className="text-blue-500 underline"
              onClick={() => {
                setIsResetting(!isResetting)
                // setIsRegister(false)
                setMessage('')
              }}
            >
              {isResetting ? 'Back to Login' : 'Forgot Password?'}
            </button>
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}
        </form>
      </div>
    </div>
  )
}
