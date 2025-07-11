import { ChangeEventHandler, ComponentRef, DragEventHandler, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
    editFormOpen: boolean;
    setEditFormOpen: (open: boolean) => void;
}

interface PreviewCardRef {
    upload: (user: User) => Promise<Photo | null>
}

const PreviewCard = forwardRef<PreviewCardRef, PreviewCardProps>((props: PreviewCardProps, ref) => {

    const {file, uploading} = props

    const [uploaded, setUploaded] = useState(false)
    const [error, setError] = useState(false)

    const [title, setTitle] = useState(file.name)
    const [editTitle, setEditTitle] = useState(false)
    const [editFormOpen, setEditFormOpen] = useState(false)
    const [rawTags, setRawTags] = useState("")
    const [tags, setTags] = useState<string[]>([])
    const [note, setNote] = useState("")

    useImperativeHandle(ref, () => ({

        async upload(user: User): Promise<Photo | null> {
            if (uploaded) return null

            const uuid = self.crypto.randomUUID();

            const { error: uploadError, data: photoData} = await supabase.storage
                .from('photo-gallery')
                .upload(uuid, file)
    
            if (uploadError) {
                setError(true)
                return null
            }

            const extension = file.type.split("/")[1]
        
            const photoResult = await supabase.from('photos').insert({
                user_id: user.id,
                asset_name: photoData.path,
                title: title,
                note: note,
                file_extension: extension
            }).select()

            if (!photoResult.data) {
                setError(true)
                return null
            }

            const photo = photoResult.data[0] as Photo

            const tagsResult = await supabase.from("tags").insert(tags.map(tag => {return {name: tag}})).select()
            
            if (!tagsResult.data) {
                setUploaded(true)
                return photo
            }
            
            await supabase.from("photo_tags").insert(tagsResult.data.map(tagResult => {return {photo_id: photo.id, tag_id: tagResult.id}}))

            setUploaded(true)
            
            return photo
        }

    }))

    const closeTitleEdit = () => {
        setEditTitle(false)
    }

    const onTagsChangeHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
        const tags = [...new Set(e.target.value.trim().split(" "))]
        setRawTags(tags.join(" "))
        setTags(tags)
    }

    const openEditForm = () => {
        if(!props.editFormOpen) {
            setEditFormOpen(true)
            props.setEditFormOpen(true)
        }
    }

    const closeEditForm = () => {
        setEditFormOpen(false)
        props.setEditFormOpen(false)
    }

    return (
        <>
            <div className="relative w-fill h-full overflow-hidden flex flex-col  border-stone-500 border-1 rounded-sm">
                <ImagePreview file={file}/>
                <button onClick={openEditForm} className="absolute bg-white w-7 h-7 top-1 right-1 rounded-2xl flex justify-center items-center opacity-40 hover:opacity-100 cursor-pointer">
                    <Image src="/edit.svg" width={20} height={20} alt="Edit"/>
                </button>
                <div className="h-10 flex items-center justify-center border-stone-500 border-t-1">
                    {editTitle ? 
                    <input type="text" value={title}
                    onChange={e => setTitle(e.target.value)} 
                    onBlur={closeTitleEdit} onKeyDown={e => e.key === "Enter" && closeTitleEdit()} 
                    className="text-stone-500 border-1 rounded-sm border-blue-500 px-1"/> : 
                    <span className="text-stone-500 cursor-text text-nowrap truncate px-2" onClick={() => setEditTitle(true)}>{title}</span>}
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

            {editFormOpen && 
                <div className="absolute flex flex-col bg-white w-[60%] h-[50%] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-md shadow-lg border border-gray-200 overflow-hidden z-1">
                    <div className="bg-black/10 w-full h-[15%] flex items-center justify-end p-2 gap-2">
                        <span className="text-stone-500 mr-auto truncate text-nowrap max-w-[90%]">{title}</span>
                        <button className="cursor-pointer" onClick={closeEditForm}>
                            <Image src="/close.svg" width={20} height={20} alt="Close"/>
                        </button>
                    </div>
                    <div className="w-full h-[85%] p-4">
                        <form className="grid grid-rows-2 h-full">
                            <div className="flex flex-col gap-2 h-full">
                                <label htmlFor="tags" className="text-gray-700 font-semibold">Tags</label>
                                <input 
                                    className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none" 
                                    type="text" id="tags" value={rawTags} onChange={(e) => setRawTags(e.target.value)} onBlur={onTagsChangeHandler}
                                />
                            </div>
                            <div className="flex flex-col gap-2 h-full">
                                <label htmlFor="note" className="text-gray-700 font-semibold">Note</label>
                                <textarea 
                                    className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none" 
                                    id="note" value={note} onChange={(e) => setNote(e.target.value)}
                                ></textarea>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </>
        
    )
})

PreviewCard.displayName = "PreviewCard"

interface UploadFormProps {
    closeCallback: () => void;
    onUpload: (photos: Photo[]) => void;
}

export default function UploadForm(props: UploadFormProps) {

    const [dragOver, setDragOver] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [editFormOpen, setEditFormOpen] = useState(false)

    const fileInput = useRef<HTMLInputElement>(null)
    const imagesRef = useRef<ComponentRef<typeof PreviewCard>[]>([])

    useEffect(() => {
        imagesRef.current = imagesRef.current.slice(0, files.length)
    }, [files])

    const openFileSelector = () => {
        if (fileInput.current && !editFormOpen) fileInput.current.click()
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

    const onDragLeaveHandler: DragEventHandler = () => {
        if (isUploading) return
        setDragOver(false)
    }

    const clear = () => {
        if(isUploading || editFormOpen) return
        setFiles([])
    }

    const upload = async () => {
        if(editFormOpen) return
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
        props.closeCallback(); 
    }

    const dragAreaColor = dragOver ? "#38a2ff" : "#c2c0c0"

    return (
        <div className="fixed top-[50%] left-[50%] translate-y-[-50%] translate-x-[-50%] rounded-lg bg-white shadow-2xl border border-gray-100 w-[50%] h-[600px] flex flex-col overflow-hidden">
            <div className="h-[10%] p-3 w-full flex justify-end bg-black/20">
                <button className="cursor-pointer" onClick={() => !isUploading && props.closeCallback()}>
                    <Image src="/close.svg" width={30} height={30} alt="close"/>
                </button>
            </div>
            <div className="relative h-[80%] p-3" onDrop={onDropHandler} onDragOver={onDragOverHandler} onDragLeave={onDragLeaveHandler}>
                <div style={{borderColor: dragAreaColor}} className={`p-3 w-full h-full border-2 border-dashed select-none rounded-md overflow-hidden`}>
                    
                    <div className="w-full h-full grid sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-[150px] gap-4 overflow-y-auto">
                        {files.map((file, index) => {
                            return (
                                //@ts-expect-error the code works
                                <PreviewCard setEditFormOpen={setEditFormOpen} editFormOpen={editFormOpen} key={index} file={file} ref={el => 
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
                <button disabled={isUploading || editFormOpen} className="cursor-pointer flex items-center gap-2 p-3 rounded-md bg-indigo-500 hover:bg-indigo-600 transition duration-200 ease-in-out shadow-md" onClick={openFileSelector}>
                    <span className="text-white uppercase font-bold">Select files</span>
                    <input type="file" className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" ref={fileInput} onChange={onFileInputChangeHandler} multiple/>
                </button>
                <button disabled={isUploading || editFormOpen} className="cursor-pointer flex items-center gap-2 p-3 rounded-md bg-gray-500 hover:bg-gray-600 transition duration-200 ease-in-out shadow-md" onClick={clear}>
                    <span className="text-white uppercase font-bold">Clear</span>
                </button>
                <button disabled={isUploading || editFormOpen} className="cursor-pointer flex items-center gap-2 p-3 rounded-md bg-emerald-500 hover:bg-emerald-600 transition duration-200 ease-in-out shadow-md" onClick={upload}>
                    {false && <Image src="/upload.svg" width={30} height={30} alt="close"/>}
                    <span className="text-white uppercase font-bold">Upload</span>
                </button>
            </div>
        </div>
    )
}