'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '@/components/Navbar'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user || !file) return

    setUploading(true)
    const filename = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError, data: photoData} = await supabase.storage
      .from('photo-gallery')
      .upload(filename, file)

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    await supabase.from('photos').insert({
      user_id: user.id,
      asset_name: photoData.path,
      title: title
    })

    setFile(null)
    setTitle('')
    setUploading(false)
    alert('Immagine caricata!')
  }

  return (
    <>
      <Navbar />
      <div className="p-4 max-w-md mx-auto mt-10">
        <h1 className="text-xl font-semibold mb-4">Carica Foto</h1>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-2" />
        <input
          type="text"
          placeholder="Titolo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded mb-2 w-full"
        />
        <button
          onClick={handleUpload}
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
          disabled={uploading}
        >
          {uploading ? 'Caricamento...' : 'Carica'}
        </button>
      </div>
    </>
  )
}

