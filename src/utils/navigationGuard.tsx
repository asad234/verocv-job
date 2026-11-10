'use client'

import { useEffect } from 'react'
import { useProfileStore } from '@/utils/profileStore'
import { usePathname, useRouter } from 'next/navigation'

export default function NavigationGuard() {
    const { hasChanges } = useProfileStore()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault()
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
            }
        }

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest('a')

            if (anchor && hasChanges) {
                const href = anchor.getAttribute('href')
                const isExternal = anchor.target === '_blank' ||
                    anchor.host !== window.location.host

                if (!isExternal && href && href !== pathname) {
                    e.preventDefault()
                    const confirmLeave = window.confirm(
                        'You have unsaved changes. Are you sure you want to leave this page?'
                    )
                    if (confirmLeave) {
                        router.push(href)
                    }
                }
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('click', handleClick)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            document.removeEventListener('click', handleClick)
        }
    }, [hasChanges, router, pathname])

    return null
}