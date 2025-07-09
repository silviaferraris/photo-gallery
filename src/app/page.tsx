'use client'
import { supabase } from '@/lib/supabaseClient'
import { createContext, useEffect, useState } from 'react'
import PhotoCard from '@/components/PhotoCard'
import Navbar from '@/components/Navbar'
import { Session } from '@supabase/auth-js'
import LoginPage from './login/page'

interface Photo {
  id: string
  image_url: string
  title: string
}

const SessionContext = createContext<Session | null>(null)

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
      setPhotos(data || [])
    }
    fetchPhotos()
  }, [])

  useEffect(() => {
    const {data: { subscription }} = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null)
        } else if (session) {
          setSession(session)
        }
      })
    return () => {
      subscription.unsubscribe()
    }
  }, [])


  const deletePhoto = (id: string, imageUrl: string) => {
      
      const path = decodeURI(imageUrl).split("/").slice(-2).join("/")

      supabase.from('photos').delete().eq('id', id).then((value) => {
        supabase.storage.from("photo-gallery").remove([path])
        const newPhotos = photos.filter((photo) => photo.id !== id)
        setPhotos(newPhotos)
      })
  }

  return (
    <SessionContext.Provider value={session}>
      {session ? 
      <>
        <Navbar />
        <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} deletePhoto={deletePhoto} />
          ))}
        </div>
      </> :
      <LoginPage/>
      }
    </SessionContext.Provider>
  )
}