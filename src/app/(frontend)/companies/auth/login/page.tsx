import AdminSignInForm from '@/components/auth/admin-auth/sign-in'
import React from 'react'

function page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-lg px-4">
        <AdminSignInForm />
      </div>
    </div>
  )
}

export default page
