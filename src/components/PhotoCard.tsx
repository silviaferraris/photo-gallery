import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Photo {
  id: string;
  asset_name: string;
  title: string;
}

interface ActionButtonProps {
  onClick?: () => void;
  color: string;
  icon: string;
  alt?: string;
  className?: string;
}

function CardActionButton(props: ActionButtonProps) {

  return (
    <button className={`cursor-pointer rounded-sm p-1 ${props.color} ${props.className ?? ""}`} onClick={props.onClick}>
      <Image src={props.icon} width={20} height={20} alt={props.alt ?? ""} />
    </button>
  )

}


export default function PhotoCard({ photo, deletePhoto }: { photo: Photo, deletePhoto: (id: string, imageUrl: string) => void }) {

  const [imageData, setImageData] = useState<string | undefined>(undefined)

  const downloadPhoto = () => {

    supabase.storage.from('photo-gallery').download(photo.asset_name, {
      transform: {
        quality: 100
      }
    })
    .then(res => {
      if (res.data) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(res.data);
        a.style = "display: none";
        a.download = photo.title;
        document.body.appendChild(a);
        a.click();
        a.remove()
      }
    })

    

  }

  useEffect(() => {

    supabase.storage.from('photo-gallery').download(photo.asset_name, {
      transform: {
        width: 400,
        resize: 'contain'
      }
    })
    .then(res => {
      if (res.data) setImageData(URL.createObjectURL(res.data))
    })

    /*
    const projectId = "asfbmseyugopgsgrwyxl"
    const bucket = "photo-gallery"
    const photoUrl = `https://${projectId}.supabase.co/storage/v1/object/authenticated/${bucket}/${photo.asset_name}`
    
    supabase.auth.getSession().then(session => {
      fetch(photoUrl, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        }
      })
      .then(res => res.blob())
      .then(blob => setImageData(URL.createObjectURL(blob)))
    })
      */

  }, [])

  return (
    <div className="group rounded overflow-hidden shadow-md bg-white">
      <div className="relative">
        {imageData && <img src={imageData} alt={photo.title} className="w-full object-cover h-48"/>}
        <div className="absolute top-0 w-full h-full bg-[#00000050] opacity-0 group-hover:opacity-100 ease-in-out duration-200">
          <CardActionButton className="absolute right-2 top-2" icon="/info.svg" color="bg-transparent" alt="Show photo information"/>
        </div>
      </div>
      <div className="p-2 flex justify-between items-center">
        <h4 className="font-semibold text-gray-700 text-nowrap truncate w-[80%]">{photo.title}</h4>
        <div className="flex gap-1">
          <CardActionButton icon="/download.svg" color="bg-blue-500" alt="Download photo" onClick={downloadPhoto}/>
          <CardActionButton icon="/delete.svg" color="bg-red-500" alt="Delete photo" onClick={() => deletePhoto(photo.id, photo.asset_name)}/>
        </div>
      </div>
    </div>
  )
}
