import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

interface Photo {
  id: string;
  image_url: string;
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


  const downloadPhoto = () => {
    
    fetch(photo.image_url)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.style = "display: none";
        a.download = photo.title;
        document.body.appendChild(a);
        a.click();
        a.remove()
      })
      .catch(() => {
        //TODO: gestione errore
      });
  }

  

  return (
    <div className="group rounded overflow-hidden shadow-md bg-white">
      <div className="relative">
        <img src={photo.image_url} alt={photo.title} className="w-full object-cover h-48"/>
        <div className="absolute top-0 w-full h-full bg-[#00000050] opacity-0 group-hover:opacity-100 ease-in-out duration-200">
          <CardActionButton className="absolute right-2 top-2" icon="/info.svg" color="bg-transparent" alt="Show photo information"/>
        </div>
      </div>
      <div className="p-2 flex justify-between items-center">
        <h4 className="font-semibold text-gray-700">{photo.title}</h4>
        <div className="flex gap-1">
          <CardActionButton icon="/download.svg" color="bg-blue-500" alt="Download photo" onClick={downloadPhoto}/>
          <CardActionButton icon="/delete.svg" color="bg-red-500" alt="Delete photo" onClick={() => deletePhoto(photo.id, photo.image_url)}/>
        </div>
      </div>
    </div>
  )
}
