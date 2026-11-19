"use client"
// FILE LOCATION:  src/components/shared/ProfilePhoto.tsx   (NEW)
// A round profile picture: the uploaded photo, or the person's initials when there is none
// (or the photo can't load).

import { useEffect, useState } from "react"

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"

export default function ProfilePhoto({
  src, name, size = 32, className = "", bg = "rgb(5,22,80)",
}: { src: string | null | undefined; name: string; size?: number; className?: string; bg?: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [src])
  const style = { width: size, height: size }
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} style={style} onError={() => setBroken(true)}
        className={`rounded-full object-cover flex-shrink-0 bg-gray-100 ${className}`} />
    )
  }
  return (
    <span style={{ ...style, backgroundColor: bg, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {initials(name)}
    </span>
  )
}
