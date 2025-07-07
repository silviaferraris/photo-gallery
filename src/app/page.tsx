'use client'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import PhotoCard from '@/components/PhotoCard'
import Navbar from '@/components/Navbar'

interface Photo {
  id: string
  image_url: string
  title: string
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
      setPhotos(data || [])
    }
    fetchPhotos()
  }, [])

  return (
    <>
      <Navbar />
      <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </>
  )
}