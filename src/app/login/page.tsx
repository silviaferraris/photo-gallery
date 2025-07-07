'use client'
import { supabase } from '../../lib/supabaseClient'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setMessage('Controlla la tua email per il link di login.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Login via Magic Link</h1>
      <input
        type="email"
        placeholder="Email"
        className="p-2 border rounded mb-2 w-full max-w-xs"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
        Invia Link
      </button>
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  )
}