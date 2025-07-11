'use client'
import { supabase } from '@/lib/supabaseClient'
import { createContext, useEffect, useState } from 'react'
import PhotoCard from '@/components/PhotoCard'
import Navbar from '@/components/Navbar'
import { Session } from '@supabase/auth-js'
import LoginPage from './login/page'
import UploadForm from '@/components/UploadForm'
import Image from 'next/image'

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
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null)

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


  const requestDeletePhoto = (photo: Photo) => {
    setPhotoToDelete(photo)
  }

  const confirmDeletePhoto = () => {
    if (!photoToDelete) return

    supabase.from('photos').delete().eq('asset_name', photoToDelete.asset_name).then(() => {
      supabase.storage.from("photo-gallery").remove([photoToDelete.asset_name])
      const newPhotos = photos.filter((p) => p.asset_name !== photoToDelete.asset_name)
      setPhotos(newPhotos)
      setPhotoToDelete(null)
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
      {session ? (
        <>
          <div className="bg-white min-h-screen">
            <Navbar />
            <div className="text-center py-10 px-4 sm:px-8 md:px-16 bg-white border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Benvenuto nella tua galleria di ricordi</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                Qui puoi conservare e rivedere i tuoi momenti più belli. Carica le foto dei tuoi viaggi, eventi speciali o giornate indimenticabili.
              </p>
              <button
                onClick={() => setUploadFormOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-md shadow transition-colors cursor-pointer"
              >
                Upload
              </button>
            </div>
            <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {photos.map((photo) => (
                <div key={photo.asset_name} className="shadow-md rounded">
                  <PhotoCard photo={photo} deletePhoto={() => requestDeletePhoto(photo)} setInfo={setInfo} />
                </div>
              ))}
            </div>
          </div>
          {info && 
            <div className="fixed flex flex-col bg-white w-[90%] sm:w-[70%] md:w-[50%] lg:w-[40%] h-[60%] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-xl overflow-hidden shadow-2xl z-50 border border-stone-200">
              <div className="bg-[#f9f9f9] w-full h-[10%] flex items-center justify-between px-4 py-2 border-b border-stone-200">
                <span className="text-gray-800 font-semibold truncate max-w-[85%]">{info.title}</span>
                <button className="cursor-pointer hover:scale-110 transition-transform" onClick={() => setInfo(null)}>
                  <Image src="/close.svg" width={20} height={20} alt="Close"/>
                </button>
              </div>
              <div className="w-full h-[90%] p-4 overflow-y-auto space-y-4 text-sm text-gray-700">
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Tags</label>
                  {info.tags && info.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {info.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-500 text-white text-xs rounded-full px-3 py-1">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Nessun tag</p>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Data di creazione</label>
                  <p className="bg-gray-100 rounded-md px-3 py-2">{new Date(info.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Formato file</label>
                  <p className="bg-gray-100 rounded-md px-3 py-2">{info.file_extension.toUpperCase()}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Note</label>
                  <div className="bg-gray-100 rounded-md px-3 py-2 max-h-32 overflow-y-auto">
                    <p>{info.note || "Nessuna nota"}</p>
                  </div>
                </div>
              </div>
            </div>
          }
          {photoToDelete && (
            <div className="fixed flex flex-col bg-white w-[90%] sm:w-[70%] md:w-[50%] lg:w-[30%] h-auto top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-xl shadow-2xl z-50 border border-stone-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Conferma eliminazione</h3>
              <p className="text-gray-600 text-sm">
                Sei sicuro di voler eliminare la foto <span className="font-medium">&quot;{photoToDelete.title}&quot;</span>? Questa azione è irreversibile.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md cursor-pointer"
                  onClick={() => setPhotoToDelete(null)}
                >
                  Annulla
                </button>
                <button
                  className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md cursor-pointer"
                  onClick={confirmDeletePhoto}
                >
                  Elimina
                </button>
              </div>
            </div>
          )}
          {uploadFormOpen && <UploadForm closeCallback={closeUploadForm} onUpload={onUploadHandler} />}
        </>
      ) : (
        <LoginPage />
      )}
    </SessionContext.Provider>
  )
}