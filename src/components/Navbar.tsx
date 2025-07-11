import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

interface NavbarProps {
  openUploadForm: () => void;
}

export default function Navbar(props: NavbarProps) {

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
      <h1 className="text-lg font-bold text-gray-700">Galleria di viaggio</h1>
      <div className="space-x-8 flex items-center">
        {logged ? (
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 12a5 5 0 100-10 5 5 0 000 10zm-7 7a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Profilo
            </button>
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-10">
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login" className="text-blue-600">Login</Link>
        )}
      </div>
    </nav>
  )
}