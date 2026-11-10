'use client'

import { useState, useEffect } from 'react'

type Language = 'en' | 'sv'

interface AuthTranslations {
  en: {
    // Sign In Form
    welcomeBack: string
    signInToContinue: string
    signInToContinueAdmin: string
    email: string
    password: string
    forgotPassword: string
    signIn: string
    signingIn: string
    orContinueWith: string
    dontHaveAccount: string
    signUp: string

    // Sign Up Form
    createAccount: string
    signUpToGetStarted: string
    firstName: string
    lastName: string
    confirmPassword: string
    orContinueWithEmail: string
    acceptTerms: string
    termsOfService: string
    createAccountBtn: string
    creatingAccount: string
    alreadyHaveAccount: string
    signInBtn: string

    // Common
    soon: string

    // Error Messages
    loginFailed: string
    invalidCredentials: string
    registrationFailed: string
    passwordsDontMatch: string
    passwordTooShort: string
    socialSignInFailed: string
    autoSignInFailed: string

    // Placeholders
    emailPlaceholder: string
    firstNamePlaceholder: string
    lastNamePlaceholder: string
    passwordPlaceholder: string
  }
  sv: {
    // Sign In Form
    welcomeBack: string
    signInToContinue: string
    signInToContinueAdmin: string
    email: string
    password: string
    forgotPassword: string
    signIn: string
    signingIn: string
    orContinueWith: string
    dontHaveAccount: string
    signUp: string

    // Sign Up Form
    createAccount: string
    signUpToGetStarted: string
    firstName: string
    lastName: string
    confirmPassword: string
    orContinueWithEmail: string
    acceptTerms: string
    termsOfService: string
    createAccountBtn: string
    creatingAccount: string
    alreadyHaveAccount: string
    signInBtn: string

    // Common
    soon: string

    // Error Messages
    loginFailed: string
    invalidCredentials: string
    registrationFailed: string
    passwordsDontMatch: string
    passwordTooShort: string
    socialSignInFailed: string
    autoSignInFailed: string

    // Placeholders
    emailPlaceholder: string
    firstNamePlaceholder: string
    lastNamePlaceholder: string
    passwordPlaceholder: string
  }
}

const translations: AuthTranslations = {
  en: {
    // Sign In Form
    welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to your account to continue with',
    signInToContinueAdmin: 'Sign in to your admin account to continue to the admin panel',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    orContinueWith: 'Or continue with',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign up',

    // Sign Up Form
    createAccount: 'Create account',
    signUpToGetStarted: 'Sign up to get started with',
    firstName: 'First Name',
    lastName: 'Last Name',
    confirmPassword: 'Confirm Password',
    orContinueWithEmail: 'Or continue with email/password',
    acceptTerms: 'I accept the',
    termsOfService: 'Terms & Privacy',
    createAccountBtn: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signInBtn: 'Sign in',

    // Common
    soon: 'Soon',

    // Error Messages
    loginFailed: 'Login failed. Please try again.',
    invalidCredentials: 'Invalid email or password. Please try again.',
    registrationFailed: 'Registration failed. Please try again.',
    passwordsDontMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters long',
    socialSignInFailed: 'Failed to sign in with {provider}. Please try again.',
    autoSignInFailed: 'Registration successful, but auto sign-in failed. Please sign in manually.',

    // Placeholders
    emailPlaceholder: 'name@example.com',
    firstNamePlaceholder: 'John',
    lastNamePlaceholder: 'Doe',
    passwordPlaceholder: '••••••••',
  },
  sv: {
    // Sign In Form
    welcomeBack: 'Välkommen tillbaka',
    signInToContinue: 'Logga in på ditt konto för att fortsätta med',
    signInToContinueAdmin: 'Logga in på ditt konto för att fortsätta till adminpanelen',
    email: 'E-post',
    password: 'Lösenord',
    forgotPassword: 'Glömt lösenord?',
    signIn: 'Logga In',
    signingIn: 'Loggar in...',
    orContinueWith: 'Eller fortsätt med',
    dontHaveAccount: 'Har du inget konto?',
    signUp: 'Registrera dig',

    // Sign Up Form
    createAccount: 'Skapa konto',
    signUpToGetStarted: 'Registrera dig för att komma igång med',
    firstName: 'Förnamn',
    lastName: 'Efternamn',
    confirmPassword: 'Bekräfta Lösenord',
    orContinueWithEmail: 'Eller fortsätt med e-post/lösenord',
    acceptTerms: 'Jag accepterar',
    termsOfService: 'Användarvillkoren & Integritetspolicyn',
    createAccountBtn: 'Skapa Konto',
    creatingAccount: 'Skapar konto...',
    alreadyHaveAccount: 'Har du redan ett konto?',
    signInBtn: 'Logga in',

    // Common
    soon: 'Snart',

    // Error Messages
    loginFailed: 'Inloggning misslyckades. Försök igen.',
    invalidCredentials: 'Ogiltig e-post eller lösenord. Försök igen.',
    registrationFailed: 'Registrering misslyckades. Försök igen.',
    passwordsDontMatch: 'Lösenorden matchar inte',
    passwordTooShort: 'Lösenordet måste vara minst 6 tecken långt',
    socialSignInFailed: 'Misslyckades att logga in med {provider}. Försök igen.',
    autoSignInFailed:
      'Registrering lyckades, men automatisk inloggning misslyckades. Logga in manuellt.',

    // Placeholders
    emailPlaceholder: 'namn@exempel.se',
    firstNamePlaceholder: 'Anna',
    lastNamePlaceholder: 'Andersson',
    passwordPlaceholder: '••••••••',
  },
}

export const useAuthTranslation = (initialLanguage?: Language) => {
  // Get initial language from parameter or localStorage or default to 'en'
  const getInitialLanguage = (): Language => {
    if (initialLanguage) return initialLanguage

    if (typeof window !== 'undefined') {
      // CHANGED: Use 'dashboardLanguage' key to match dashboard
      const savedLanguage = localStorage.getItem('dashboardLanguage') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'sv')) {
        return savedLanguage
      }
    }

    return 'en'
  }

  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    const handleStorageChange = () => {
      // CHANGED: Use 'dashboardLanguage' key to match dashboard
      const savedLanguage = localStorage.getItem('dashboardLanguage') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'sv')) {
        setLanguage(savedLanguage)
      }
    }

    handleStorageChange()

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('languageChange', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('languageChange', handleStorageChange)
    }
  }, [])

  const switchLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    // CHANGED: Use 'dashboardLanguage' key to match dashboard
    localStorage.setItem('dashboardLanguage', newLanguage)
    window.dispatchEvent(new CustomEvent('languageChange'))
  }

  return {
    language,
    setLanguage: switchLanguage,
    t: translations[language],
  }
}
