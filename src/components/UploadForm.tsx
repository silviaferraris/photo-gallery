import { DragEventHandler, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

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

interface UploadFormProps {
    closeCallback: () => void;
}

export default function UploadForm(props: UploadFormProps) {

    const [dragOver, setDragOver] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedIndexes, setUploadedIndexes] = useState<number[]>([])
    const [errorIndexes, setErrorIndexes] = useState<number[]>([])

    const onDropHandler: DragEventHandler = (e) => {
        if (isUploading) return
        setDragOver(false)
        e.preventDefault()

        let droppedFiles: File[]
        
        if (e.dataTransfer.items)
            droppedFiles = [...e.dataTransfer.items].filter(item => item.kind === "file").map(item => item.getAsFile()).filter(file => file !== null)
        else 
            droppedFiles = [...e.dataTransfer.files]
        
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
        setErrorIndexes([])
        setUploadedIndexes([])
    }

    const upload = async () => {

        if(isUploading) return

        const user = (await supabase.auth.getUser()).data.user

        if(!user) return

        setIsUploading(true)
        setErrorIndexes([])

        const promises = files.map(async (file, index) => {
            if (uploadedIndexes.includes(index)) return

            let uuid = self.crypto.randomUUID();

            const { error: uploadError, data: photoData} = await supabase.storage
                .from('photo-gallery')
                .upload(uuid, file)
    
            if (uploadError) {
                setErrorIndexes([...errorIndexes, index])
                return
            }
        
            await supabase.from('photos').insert({
                user_id: user.id,
                asset_name: photoData.path,
                title: file.name
            })

            setUploadedIndexes([...uploadedIndexes, index])
        })

        await Promise.allSettled(promises)

        setIsUploading(false)
    }

    const dragAreaColor = dragOver ? "#38a2ff" : "#c2c0c0"
    const overlayStyle = "absolute top-0 left-0 w-full h-full bg-white/80 flex justify-center items-center"

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
                                <div key={index} className="relative w-full h-full overflow-hidden flex flex-col  border-stone-500 border-1 rounded-sm">
                                    <ImagePreview file={file}/>
                                    <div className="h-10 flex items-center justify-center border-stone-500 border-t-1">
                                        <span className="text-stone-500">{file.name}</span>
                                    </div>
                                    
                                    {
                                    uploadedIndexes.includes(index) ? <div className={overlayStyle}><Image src="/done.svg" width={50} height={50} alt=""/></div> : (
                                    errorIndexes.includes(index) ? <div className={overlayStyle}><Image src="/error.svg" width={50} height={50} alt=""/></div> : (
                                    isUploading && <div className={overlayStyle}><Image src="/loading.gif" width={50} height={50} alt=""/></div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                    
                    {files.length <= 3 && <h2 style={{color: dragAreaColor}} className={`absolute top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%] text-2xl uppercase font-bold`}>Drop files here</h2>}
                    
                </div>
            </div>
            <div className="h-[10%] p-3 w-full flex gap-2 justify-end">
                <button style={{backgroundColor: isUploading ? "gray" : "red"}}  className="cursor-pointer flex items-center gap-2 p-3 rounded-sm" onClick={clear}>
                    <span className="text-white uppercase font-bold">CLEAR</span>
                </button>
                <button style={{backgroundColor: isUploading ? "gray" : "blueviolet"}} className="cursor-pointer flex items-center gap-2 p-3 rounded-sm" onClick={upload}>
                    {false && <Image src="/upload.svg" width={30} height={30} alt="close"/>}
                    <span className="text-white uppercase font-bold">Upload</span>
                </button>
            </div>
        </div>
    )
}