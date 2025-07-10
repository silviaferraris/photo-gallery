'use client'
import { supabase } from '@/lib/supabaseClient'
import { createContext, useEffect, useState } from 'react'
import PhotoCard from '@/components/PhotoCard'
import Navbar from '@/components/Navbar'
import { Session } from '@supabase/auth-js'
import LoginPage from './login/page'
import UploadForm from '@/components/UploadForm'

interface Photo {
  id: string
  asset_name: string
  title: string
}

const SessionContext = createContext<Session | null>(null)

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [uploadFormOpen, setUploadFormOpen] = useState(false)

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


  const deletePhoto = (id: string, assetName: string) => {
      
      supabase.from('photos').delete().eq('id', id).then((value) => {
        supabase.storage.from("photo-gallery").remove([assetName])
        const newPhotos = photos.filter((photo) => photo.id !== id)
        setPhotos(newPhotos)
      })
  }

  const closeUploadForm = () => {
    setUploadFormOpen(false)
  }

  return (
    <SessionContext.Provider value={session}>
      {session ? 
      <>
        <Navbar openUploadForm={() => setUploadFormOpen(true)} />
        <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} deletePhoto={deletePhoto} />
          ))}
        </div>
        {uploadFormOpen && <UploadForm closeCallback={closeUploadForm}/>}
      </> :
      <LoginPage/>
      }
    </SessionContext.Provider>
  )
}