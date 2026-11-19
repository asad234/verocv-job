'use client'
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminProfile.ts   (NEW — client)
// The business admin's photo + company logo, shared by every place that shows them:
//   useAdminProfile()  → business admin side (header avatar, Home, Settings)
//                        reads GET /api/company/admin/settings once and shares it.
//   notifyAdminProfileChanged({ avatar?, logo?, ... })
//                      → call after an upload/removal/save — every place updates at once.
//   useMyAdmin()       → manager side: their business admin (photo, name, company logo)
//                        from GET /api/company/managers/my-admin.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'

export interface AdminProfile {
  name: string
  jobTitle: string
  avatar: string | null
  companyName: string
  logo: string | null
}

export const ADMIN_PROFILE_EVENT = 'verocv:admin-profile-changed'

let cache: AdminProfile | null = null
let inflight: Promise<AdminProfile | null> | null = null

function loadAdminProfile(): Promise<AdminProfile | null> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch('/api/company/admin/settings', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        const d = b?.data
        if (!d) return null
        cache = {
          name: [d.firstName, d.lastName].filter(Boolean).join(' ').trim(),
          jobTitle: d.jobTitle ?? '',
          avatar: d.avatar ?? null,
          companyName: d.company?.companyName ?? '',
          logo: d.company?.logo ?? null,
        }
        return cache
      })
      .catch(() => null)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Tell every component that shows the admin's photo / logo / name that it changed. */
export function notifyAdminProfileChanged(patch: Partial<AdminProfile>) {
  cache = {
    ...(cache ?? { name: '', jobTitle: '', avatar: null, companyName: '', logo: null }),
    ...patch,
  }
  window.dispatchEvent(new CustomEvent(ADMIN_PROFILE_EVENT, { detail: cache }))
}

/** Business admin side. `null` while loading (or if it couldn't load). */
export function useAdminProfile(): AdminProfile | null {
  const [profile, setProfile] = useState<AdminProfile | null>(cache)
  useEffect(() => {
    let alive = true
    loadAdminProfile().then((p) => {
      if (alive && p) setProfile(p)
    })
    const onChange = (e: Event) => setProfile({ ...(e as CustomEvent<AdminProfile>).detail })
    window.addEventListener(ADMIN_PROFILE_EVENT, onChange)
    return () => {
      alive = false
      window.removeEventListener(ADMIN_PROFILE_EVENT, onChange)
    }
  }, [])
  return profile
}

/* ─── Manager side ─── */
export interface MyAdmin {
  id: string
  name: string
  jobTitle: string
  email: string
  phone: string
  avatar: string | null
  company: {
    name: string
    logo: string | null
    website: string
    email: string
    phone: string
    address: string
  }
}

/** The manager's business admin. undefined = loading, null = none. */
export function useMyAdmin(): MyAdmin | null | undefined {
  const [admin, setAdmin] = useState<MyAdmin | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    fetch('/api/company/managers/my-admin', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((b) => {
        if (alive) setAdmin(b?.data ?? null)
      })
      .catch(() => {
        if (alive) setAdmin(null)
      })
    return () => {
      alive = false
    }
  }, [])
  return admin
}
