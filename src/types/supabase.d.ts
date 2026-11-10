// types/supabase.d.ts
import { SupabaseClientOptions } from '@supabase/supabase-js'

export type CookieOptions = {
  path?: string
  maxAge?: number
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

export interface CookieMethods {
  get(name: string): string | undefined | null
  set(name: string, value: string, options: CookieOptions): void
  remove(name: string, options: CookieOptions): void
}

declare module '@supabase/supabase-js' {
  interface SupabaseClientOptions {
    cookies?: CookieMethods
  }
}
