"use client"

import { useState, useEffect } from "react"
import SignInForm from "../sign-in"
import SignUpForm from "../sign-up"

interface AuthFormsProps {
  defaultForm?: "signin" | "signup"
}

const AuthForms = ({ defaultForm = "signin" }: AuthFormsProps) => {
  const [currentForm, setCurrentForm] = useState<"signin" | "signup">(defaultForm)

  useEffect(() => {
    setCurrentForm(defaultForm)
  }, [defaultForm])

  const switchToSignUp = () => setCurrentForm("signup")
  const switchToSignIn = () => setCurrentForm("signin")

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-400/10 -z-10 rounded-b-[50%] transform -translate-y-1/2"></div>

      {currentForm === "signin" ? (
        <SignInForm onSwitchToSignUp={switchToSignUp} />
      ) : (
        <SignUpForm onSwitchToSignIn={switchToSignIn} />
      )}
    </div>
  )
}

export default AuthForms
