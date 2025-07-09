import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Navbar() {

  const [logged, setLogged] = useState(false)
  
  useEffect(() => {

    supabase.auth.getSession().then(result =>
      setLogged(result.data.session !== null)
    )

  }, [])

  const logout = () => {
    //TODO: completare signout lato backend
    supabase.auth.signOut()
    setLogged(false)
  }

  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center mb-4">
      <h1 className="text-lg font-bold text-gray-700">📸 Galleria</h1>
      <div className="space-x-4">
        {logged ? <Link href="#" onClick={logout} className="text-blue-600">Logout</Link> : <Link href="/login" className="text-blue-600">Login</Link>}
        <Link href="/" className="text-blue-600">Home</Link>
        <Link href="/upload" className="text-blue-600">Carica</Link>
      </div>
    </nav>
  )
}