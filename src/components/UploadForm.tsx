import { ChangeEventHandler, ComponentRef, DragEventHandler, forwardRef, InputEventHandler, useEffect, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Photo } from "@/app/page";
import { User } from "@supabase/supabase-js";

function ImagePreview ({ file }: {file: File}) {

    const [data, setData] = useState("")

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = () => {
            if(reader && typeof reader.result === "string") setData(reader.result)
        }
        reader.readAsDataURL(file);
    }, [])

    return (
        <div className="h-full w-full flex justify-center items-center overflow-hidden">
        {data.length !== 0 ? 
            <img src={data} alt={`Preview of ${file.name}`} className="w-full object-fill"/> :
            <span className="text-stone-500">Loading...</span>
        }
        </div>
    )
}

interface PreviewCardProps {
    file: File;
    uploading: boolean;
}

interface PreviewCardRef {
    upload: (user: User) => Promise<Photo | null>
}

const PreviewCard = forwardRef<PreviewCardRef, PreviewCardProps>((props: PreviewCardProps, ref) => {

    const {file, uploading} = props

    const [uploaded, setUploaded] = useState(false)
    const [error, setError] = useState(false)

    useImperativeHandle(ref, () => ({

        async upload(user: User): Promise<Photo | null> {
            if (uploaded) return null

            let uuid = self.crypto.randomUUID();

            const { error: uploadError, data: photoData} = await supabase.storage
                .from('photo-gallery')
                .upload(uuid, file)
    
            if (uploadError) {
                setError(true)
                return null
            }
        
            await supabase.from('photos').insert({
                user_id: user.id,
                asset_name: photoData.path,
                title: file.name
            })

            setUploaded(true)
            
            return {
                id: "",
                asset_name: photoData.path,
                title: file.name
            }
        }

    }))

    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col  border-stone-500 border-1 rounded-sm">
            <ImagePreview file={file}/>
            <div className="h-10 flex items-center justify-center border-stone-500 border-t-1">
                <span className="text-stone-500">{file.name}</span>
            </div>
            { (uploading || uploaded || error) &&
                <div className="absolute top-0 left-0 w-full h-full bg-white/80 flex justify-center items-center">
                    {
                    uploaded ? <Image src="/done.svg" width={50} height={50} alt=""/> : (
                    error ? <Image src="/error.svg" width={50} height={50} alt=""/> : (
                    uploading && <Image src="/loading.gif" width={50} height={50} alt=""/>
                    ))}
                </div>
            }
            
        </div>
    )
})

interface UploadFormProps {
    closeCallback: () => void;
    onUpload: (photos: Photo[]) => void;
}

export default function UploadForm(props: UploadFormProps) {

    const [dragOver, setDragOver] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const fileInput = useRef<HTMLInputElement>(null)
    const imagesRef = useRef<ComponentRef<typeof PreviewCard>[]>([])

    useEffect(() => {
        imagesRef.current = imagesRef.current.slice(0, files.length)
    }, [files])

    const openFileSelector = () => {
        if (fileInput.current) fileInput.current.click()
    }

    const onFileInputChangeHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files) {
            setFiles([...files, ...e.target.files])
        }
    }

    const onDropHandler: DragEventHandler = (e) => {
        if (isUploading) return
        setDragOver(false)
        e.preventDefault()

        let droppedFiles: File[]
        
        if (e.dataTransfer.items)
            droppedFiles = [...e.dataTransfer.items]
                .filter(item => item.kind === "file")
                .map(item => item.getAsFile())
                .filter(file => file !== null)
                .filter(file => file.type.startsWith("image/"))
        else 
            droppedFiles = [...e.dataTransfer.files].filter(file => file.type.startsWith("image/"))
        
        setFiles([...files, ...droppedFiles])
    }

    const onDragOverHandler: DragEventHandler = (e) => {
        if (isUploading) return
        setDragOver(true)
        e.stopPropagation()
        e.preventDefault()
    }

    const onDragLeaveHandler: DragEventHandler = (e) => {
        if (isUploading) return
        setDragOver(false)
    }

    const clear = () => {
        if(isUploading) return
        setFiles([])
    }

    const upload = async () => {
        setIsUploading(true)
        
        const user = (await supabase.auth.getUser()).data.user
        if(!user) return

        const p: Promise<Photo | null>[] = imagesRef.current.map(ref => {
            return ref.upload(user)
        })
        
        await Promise.allSettled(p).then(results => {
            const uploaded = results
                .filter(result => result.status === "fulfilled")
                .map(result => result.value)
                .filter(result => result !== null)
            props.onUpload(uploaded)
        })
        setIsUploading(false)
    }

    const dragAreaColor = dragOver ? "#38a2ff" : "#c2c0c0"

    return (
        <div className="fixed top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%] rounded-md w-[50%] h-[600px] bg-white shadow-xl/30 flex flex-col overflow-hidden">
            <div className="h-[10%] p-3 w-full flex justify-end">
                <button className="cursor-pointer" onClick={() => !isUploading && props.closeCallback()}>
                    <Image src="/close.svg" width={30} height={30} alt="close"/>
                </button>
            </div>
            <div className="relative h-[80%] p-3" onDrop={onDropHandler} onDragOver={onDragOverHandler} onDragLeave={onDragLeaveHandler}>
                <div style={{borderColor: dragAreaColor}} className={`p-3 w-full h-full border-6 border-dashed select-none rounded-md overflow-hidden`}>
                    
                    <div className="w-full h-full grid grid-cols-3 auto-rows-[150px] gap-4 overflow-y-auto">
                        {files.map((file, index) => {
                            return (
                                <PreviewCard key={index} file={file} ref={el => 
                                    el && (imagesRef.current[index] = el)
                                }
                                uploading={isUploading}/>
                            )
                        })}
                    </div>
                    
                    {files.length <= 3 && <h2 style={{color: dragAreaColor}} className={`absolute top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%] text-2xl uppercase font-bold`}>Drop files here</h2>}
                    
                </div>
            </div>
            <div className="h-[10%] p-3 w-full flex gap-2 justify-end">
                <button style={{backgroundColor: isUploading ? "gray" : "#17c200"}}  className="cursor-pointer flex items-center gap-2 p-3 rounded-sm" onClick={openFileSelector}>
                    <span className="text-white uppercase font-bold">Select files</span>
                    <input type="file" className="absolute invisible" accept="image/*" ref={fileInput} onChange={onFileInputChangeHandler} multiple/>
                </button>
                <button style={{backgroundColor: isUploading ? "gray" : "red"}}  className="cursor-pointer flex items-center gap-2 p-3 rounded-sm" onClick={clear}>
                    <span className="text-white uppercase font-bold">Clear</span>
                </button>
                <button style={{backgroundColor: isUploading ? "gray" : "#038cfc"}} className="cursor-pointer flex items-center gap-2 p-3 rounded-sm" onClick={upload}>
                    {false && <Image src="/upload.svg" width={30} height={30} alt="close"/>}
                    <span className="text-white uppercase font-bold">Upload</span>
                </button>
            </div>
        </div>
    )
}