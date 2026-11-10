'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { X } from "lucide-react"
import { ImagePositionEditor } from "../CV/edit-forms/personal-info-form"
import { PersonalInformation } from "@/types/payloadTypes"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"

export type ProfileImageValue = {
    uploadImage?: string | null
    staticImage?: string | null
} | null

interface Props {
    mode?: "modal" | "inline"
    personalInformation?: PersonalInformation | null
    images?: string[]
    value?: ProfileImageValue
    onChange?: (val: ProfileImageValue) => void
    onClose?: () => void
    isOpen?: boolean
}

export default function ProfileImageSelector({
    mode = "inline",
    personalInformation,
    images = [],
    value,
    onChange,
    onClose,
    isOpen = false,
}: Props) {
    const fileRef = useRef<HTMLInputElement>(null)
    const imageCache = useRef<Map<string, string>>(new Map())

    const { t } = useDashboardTranslation()
    const isModal = mode === "modal"

    const [rawImage, setRawImage] = useState<string | null>(null)
    const [showEditor, setShowEditor] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)

    // ---------------- CACHE ----------------
    const getCachedBlobUrl = useCallback(async (url: string) => {
        const cached = imageCache.current.get(url)
        if (cached) return cached

        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)

        imageCache.current.set(url, objectUrl)
        return objectUrl
    }, [])

    // ---------------- PROFILE IMAGE (OPTIMIZED) ----------------
    const getCurrentProfileImage = useCallback((): string | null => {
        const profileImage = personalInformation?.profileImage
        if (!profileImage) return null

        if (profileImage.staticImage) return profileImage.staticImage

        if (profileImage.uploadImage) {
            if (typeof profileImage.uploadImage === "string") {
                return `${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/file/${profileImage.uploadImage}`
            }

            if (typeof profileImage.uploadImage === "object" && "url" in profileImage.uploadImage) {
                return (profileImage.uploadImage as any).url
            }
        }

        return null
    }, [personalInformation])

    // ---------------- PREVIEW (MEMOIZED) ----------------
    const preview = useMemo(() => {
        if (value?.staticImage) return value.staticImage

        if (value?.uploadImage) {
            return value.uploadImage.startsWith("http")
                ? value.uploadImage
                : `${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/file/${value.uploadImage}`
        }

        return getCurrentProfileImage()
    }, [value, getCurrentProfileImage])

    // ---------------- AVATAR SYNC ----------------
    useEffect(() => {
        const img = personalInformation?.profileImage?.staticImage
        if (img) {
            const match = img.match(/img(\d+)\.jpg/)
            setSelectedAvatar(match ? Number(match[1]) : null)
        } else {
            setSelectedAvatar(null)
        }
    }, [personalInformation])

    // ---------------- EDITOR FLOW (OPTIMIZED) ----------------
    const openEditor = useCallback(async (img: string) => {
        try {
            setError(null)
            setLoading(true)

            const blobUrl = await getCachedBlobUrl(img)
            setRawImage(blobUrl)
            setShowEditor(true)

        } catch {
            setError("Failed to load image")
        } finally {
            setLoading(false)
        }
    }, [getCachedBlobUrl])

    // ---------------- UPLOAD ----------------
    const handleUpload = useCallback((file: File) => {
        const url = URL.createObjectURL(file)
        setRawImage(url)
        setShowEditor(true)
    }, [])

    // ---------------- CV ----------------
    const handleSelectCVImage = useCallback((img: string) => {
        openEditor(img)
    }, [openEditor])

    // ---------------- AVATAR ----------------
    const handleAvatar = useCallback((num: number) => {
        const url = `/avatars/img${num}.jpg`
        setSelectedAvatar(num)
        openEditor(url)
    }, [openEditor])

    // ---------------- API ----------------
    const uploadToAPI = async (file: File) => {
        const fd = new FormData()
        fd.append("file", file)

        const res = await fetch("/api/profile-picture", {
            method: "POST",
            body: fd,
        })

        if (!res.ok) throw new Error("Upload failed")

        const data = await res.json()
        return data.profileImage?.uploadImage
    }

    // ---------------- SAVE ----------------
    const handleEditorSave = async (cropped: string) => {
        setLoading(true)

        try {
            const blob = await fetch(cropped).then(r => r.blob())
            const file = new File([blob], "profile.jpg", { type: "image/jpeg" })

            const id = await uploadToAPI(file)

            onChange?.({
                uploadImage: id,
                staticImage: null,
            })

            setShowEditor(false)
            setRawImage(null)

        } finally {
            setLoading(false)
        }
    }

    // ---------------- REMOVE ----------------
    const handleRemove = useCallback(async () => {
        setLoading(true)

        try {
            await fetch("/api/profile-picture", {
                method: "POST",
                body: JSON.stringify({ removeImage: true }),
            })

            onChange?.({ uploadImage: null, staticImage: null })
            setSelectedAvatar(null)

        } finally {
            setLoading(false)
        }
    }, [onChange])

    // ---------------- UI ----------------
    const content = useMemo(() => (
        <div className="space-y-6">

            {/* PREVIEW */}
            <div className="flex flex-col items-center">
                {preview ? (
                    <img
                        src={preview}
                        className="w-24 h-24 rounded-full object-cover ring-1 ring-gray-200"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-600 text-white text-xl">
                        ?
                    </div>
                )}

                {preview && (
                    <button
                        onClick={handleRemove}
                        className="text-xs text-red-500 mt-2"
                        disabled={loading}
                    >
                        Remove
                    </button>
                )}
            </div>

            {/* CV */}
            {images.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase">From CV</p>
                    <div className="grid grid-cols-3 gap-3">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => handleSelectCVImage(img)}
                                className="border rounded-md overflow-hidden"
                            >
                                <img src={img} className="h-16 w-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* UPLOAD */}
            <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                    e.target.value = ""
                }}
            />

            <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md"
            >
                Upload new image
            </button>

            {/* AVATARS */}
            <div>
                <p className="text-xs text-gray-500 mb-2 uppercase">Avatars</p>
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <button
                            key={num}
                            onClick={() => handleAvatar(num)}
                            className={`rounded-full p-[2px] ${selectedAvatar === num ? "ring-2 ring-blue-600" : ""
                                }`}
                        >
                            <img
                                src={`/avatars/img${num}.jpg`}
                                className="w-14 h-14 rounded-full"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <p className="text-sm text-blue-600 text-center">{t.saving}</p>
            )}

            {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
            )}

        </div>
    ), [
        preview,
        images,
        loading,
        error,
        selectedAvatar,
        handleAvatar,
        handleSelectCVImage,
        handleUpload,
        handleRemove,
    ])

    // ---------------- MODAL ----------------
    return (
        <>
            {isModal ? (
                isOpen ? (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
                        onClick={onClose}
                    >
                        <div
                            className="bg-white w-full max-w-md rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b flex justify-between">
                                <h2 className="font-semibold">Profile Image</h2>
                                <button onClick={onClose}><X /></button>
                            </div>

                            <div className="p-6">{content}</div>
                        </div>
                    </div>
                ) : null
            ) : (
                content
            )}

            {/* EDITOR */}
            {showEditor && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] p-4">
                    <div className="bg-white w-full max-w-2xl rounded-lg">
                        <div className="p-4 border-b flex justify-between">
                            <h3 className="font-semibold">Adjust Image</h3>
                            <button onClick={() => { setShowEditor(false); setRawImage(null) }}>
                                <X />
                            </button>
                        </div>

                        <div className="p-4">
                            <ImagePositionEditor
                                imageSrc={rawImage || ""}
                                onSave={handleEditorSave}
                                onCancel={() => {
                                    setShowEditor(false)
                                    setRawImage(null)
                                }}
                                isCircular
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}