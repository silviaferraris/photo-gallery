interface Photo {
  id: string;
  image_url: string;
  title: string;
}

export default function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div className="rounded overflow-hidden shadow-md bg-white">
      <img src={photo.image_url} alt={photo.title} className="w-full object-cover h-48" />
      <div className="p-2">
        <h2 className="text-sm font-semibold text-gray-700">{photo.title}</h2>
      </div>
    </div>
  )
}
