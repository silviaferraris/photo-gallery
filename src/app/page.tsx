'use client'
import { supabase } from '@/lib/supabaseClient'
import { createContext, useEffect, useState } from 'react'
import PhotoCard from '@/components/PhotoCard'
import Navbar from '@/components/Navbar'
import { Session } from '@supabase/auth-js'
import LoginPage from './login/page'
import UploadForm from '@/components/UploadForm'
import Image from 'next/image'
import { Span } from 'next/dist/trace'

export interface Photo {
  id: string;
  asset_name: string;
  title: string;
  file_extension: string;
  note: string;
  user_id: string;
  created_at: string;
  tags?: {name: string}[]
}

const SessionContext = createContext<Session | null>(null)

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [uploadFormOpen, setUploadFormOpen] = useState(false)
  const [info, setInfo] = useState<Photo | null>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase.from('photos').select(`
        *,
        tags (name)
        `).order('created_at', { ascending: false })
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


  const deletePhoto = (assetName: string) => {
      
      supabase.from('photos').delete().eq('asset_name', assetName).then((value) => {
        supabase.storage.from("photo-gallery").remove([assetName])
        const newPhotos = photos.filter((photo) => photo.asset_name !== assetName)
        setPhotos(newPhotos)
      })
  }

  const closeUploadForm = () => {
    setUploadFormOpen(false)
  }

  const onUploadHandler = (uploaded: Photo[]) => {
    setPhotos([...photos, ...uploaded])
  }

  return (
    <SessionContext.Provider value={session}>
      {session ? 
      <>
        <Navbar openUploadForm={() => setUploadFormOpen(true)} />
        <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.asset_name} photo={photo} deletePhoto={deletePhoto} setInfo={setInfo} />
          ))}
        </div>
        {info && 
          <div className="fixed flex flex-col bg-white w-[60%] h-[50%] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-sm overflow-hidden shadow-md/30 z-1">
              <div className="bg-black/10 w-full h-[10%] flex items-center justify-end p-2 gap-2">
                  <span className="text-stone-500 mr-auto truncate text-nowrap max-w-[90%]">{info.title}</span>
                  <button className="cursor-pointer" onClick={() => setInfo(null)}>
                      <Image src="/close.svg" width={20} height={20} alt="Close"/>
                  </button>
              </div>
              <div className="w-full h-[85%] p-2">
                  <form className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                          <label className="text-stone-500">Tags</label>
                          {info.tags && info.tags.length > 0 && 
                            <div className="border-1 border-stone-500 text-stone-500 rounded-sm p-1 flex gap-2">
                              {info.tags.map((tag, index) => (
                                <span key={index} className="bg-[#5061fa] rounded-2xl px-2 py-1 text-white">{tag.name}</span>
                              ))}
                            </div>
                          }
                      </div>
                      <div className="flex flex-col">
                          <label className="text-stone-500">Date of creation</label>
                          <p className="border-1 border-stone-500 text-stone-500 rounded-sm p-1">{new Date(info.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col">
                          <label className="text-stone-500">File format</label>
                          <p className="border-1 border-stone-500 text-stone-500 rounded-sm p-1">{info.file_extension.toUpperCase()}</p>
                      </div>
                      <div className="flex flex-col">
                          <label className="text-stone-500">Note</label>
                          <div className="border-1 border-stone-500 text-stone-500 rounded-sm p-1 max-h-25 overflow-y-auto">
                              <p>{info.note}</p>
                          </div>
                      </div>
                      
                  </form>
              </div>
          </div>
        }
        {uploadFormOpen && <UploadForm closeCallback={closeUploadForm} onUpload={onUploadHandler}/>}
      </> :
      <LoginPage/>
      }
    </SessionContext.Provider>
  )
}