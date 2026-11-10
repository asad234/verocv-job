export const authTranslations = {
  en: {
    // Sign Up Form
    createAccount: 'Create account',
    signUpToGetStarted: 'Sign up to get started with',
    orContinueWith: 'Or continue with email/password',
    firstName: 'First Name',
    firstNamePlaceholder: 'John',
    lastName: 'Last Name',
    lastNamePlaceholder: 'Doe',
    email: 'Email',
    emailPlaceholder: 'name@example.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: '••••••••',
    iAcceptThe: 'I accept the',
    termsOfService: 'Terms & Privacy',
    createAccountButton: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    soon: 'Soon',

    // Validation errors
    firstNameRequired: 'First name and last name are required',
    emailRequired: 'Email is required',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least 6 characters long',
    registrationFailed: 'Registration failed. Please try again.',

    // Sign In Form
    welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to continue to',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    signInButton: 'Sign In',
    signingIn: 'Signing in...',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign up',

    // Sign In errors
    invalidCredentials: 'Invalid email or password',
    signInFailed: 'Sign in failed. Please try again.',
  },
  sv: {
    // Sign Up Form
    createAccount: 'Skapa konto',
    signUpToGetStarted: 'Registrera dig för att komma igång med',
    orContinueWith: 'Eller fortsätt med e-post/lösenord',
    firstName: 'Förnamn',
    firstNamePlaceholder: 'Johan',
    lastName: 'Efternamn',
    lastNamePlaceholder: 'Andersson',
    email: 'E-post',
    emailPlaceholder: 'namn@exempel.se',
    password: 'Lösenord',
    passwordPlaceholder: '••••••••',
    confirmPassword: 'Bekräfta Lösenord',
    confirmPasswordPlaceholder: '••••••••',
    iAcceptThe: 'Jag accepterar',
    termsOfService: 'Användarvillkoren & Integritetspolicyn',
    createAccountButton: 'Skapa Konto',
    creatingAccount: 'Skapar konto...',
    alreadyHaveAccount: 'Har du redan ett konto?',
    signIn: 'Logga in',
    soon: 'Snart',

    // Validation errors
    firstNameRequired: 'För- och efternamn krävs',
    emailRequired: 'E-post krävs',
    passwordsDoNotMatch: 'Lösenorden matchar inte',
    passwordMinLength: 'Lösenordet måste vara minst 6 tecken långt',
    registrationFailed: 'Registrering misslyckades. Försök igen.',

    // Sign In Form
    welcomeBack: 'Välkommen tillbaka',
    signInToContinue: 'Logga in för att fortsätta till',
    rememberMe: 'Kom ihåg mig',
    forgotPassword: 'Glömt lösenord?',
    signInButton: 'Logga In',
    signingIn: 'Loggar in...',
    dontHaveAccount: 'Har du inget konto?',
    signUp: 'Registrera dig',

    // Sign In errors
    invalidCredentials: 'Ogiltig e-post eller lösenord',
    signInFailed: 'Inloggning misslyckades. Försök igen.',
  },
}

export type AuthLanguage = 'en' | 'sv'
