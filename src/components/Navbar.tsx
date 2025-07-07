import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center mb-4">
      <h1 className="text-lg font-bold text-gray-700">📸 Galleria</h1>
      <div className="space-x-4">
        <Link href="/login" className="text-blue-600">Login</Link>
        <Link href="/" className="text-blue-600">Home</Link>
        <Link href="/upload" className="text-blue-600">Carica</Link>
      </div>
    </nav>
  )
}