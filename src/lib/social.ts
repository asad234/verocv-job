// lib/social.ts
export function generateShareableLink(invitationId: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/join/${invitationId}`
}

export function getSocialShareLinks(invitationId: string, message: string) {
  const url = generateShareableLink(invitationId)
  const encodedMessage = encodeURIComponent(message)
  const encodedUrl = encodeURIComponent(url)

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    email: `mailto:?subject=Join%20me!&body=${encodedMessage}%0A%0A${encodedUrl}`,
    copy: url,
  }
}
