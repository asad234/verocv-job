'use client'
import { useState, useEffect, useCallback } from 'react'
import { useProfileStore } from '@/utils/profileStore'
import type { Profile } from '@/payload-types'
import { dashboardTranslations } from '@/utils/dashboardTranslations'
import { formTranslations } from '@/utils/formTranslations'
import { onboardingTranslations } from '@/utils/Onboardingtranslations' // adjust path to match yours

// Use only the languages we support for dashboard translations
export type DashboardLanguage = 'en' | 'sv'

interface DashboardTranslations {
  en: {
    // Navigation
    home: string
    dashboard: string
    profile: string
    myProfile: string
    cv: string
    availability: string
    details: string
    portfolios: string
    featureRequest: string
    sendInvitation: string
    settings: string
    helpSupport: string
    accountSettings: string
    signOut: string
    collapse: string
    expandSidebar: string
    collapseSidebar: string
    // Dashboard Home
    welcomeTitle: string
    welcomeSubtitle: string
    getStarted: string
    step1Title: string
    step1Description: string
    step2Title: string
    step2Description: string
    step3Title: string
    step3Description: string
    step4Title: string
    step4Description: string
    completionMessage: string
    // Technical Skills
    technicalSkills: string
    noSkillsAdded: string
    needProfileForSkills: string
    createProfile: string
    updateProfile: string
    // CV Card
    cvTitle: string
    downloadCV: string
    previewCV: string
    noCVAvailable: string
    createCVFirst: string
    // Feedback Form
    feedbackTitle: string
    feedbackSubtitle: string
    rateExperience: string
    terrible: string
    amazing: string
    perfectTenQuestion: string
    perfectTenPlaceholder: string
    changeRemoveQuestion: string
    changeRemovePlaceholder: string
    submitFeedback: string
    submitting: string
    feedbackSuccess: string
    feedbackError: string
    networkError: string
    selectRating: string
    // Language
    profileLanguage: string
    switchToEnglish: string
    switchToSwedish: string
    // Profile Recommendations
    profileRecommendations: string
    profileCompletion: string
    fieldsCompleted: string
    enhanceProfile: string
    updateField: string
    profileNotCreated: string
    startProfileNow: string
    profileComplete: string
    stayActive: string
    // Feature Request Form
    featureRequestTitle: string
    featureRequestDescription: string
    featureRequestSuccessMessage: string
    featureRequestErrorMessage: string
    featureRequestErrorHelp: string
    featureNameLabel: string
    featureNameHelp: string
    featureNamePlaceholder: string
    featureDescriptionLabel: string
    featureDescriptionHelp: string
    featureDescriptionPlaceholder: string
    experienceRatingLabel: string
    experienceRatingHelp: string
    selectRatingOption: string
    ratingPoor: string
    ratingFair: string
    ratingGood: string
    ratingVeryGood: string
    ratingExcellent: string
    contactInfoLabel: string
    contactInfoHelp: string
    contactInfoPlaceholder: string
    submittingButton: string
    submitButton: string
    // Invitations
    sendInvitations: string
    addInvite: string
    emailLabel: string
    emailPlaceholder: string
    firstNameLabel: string
    firstNamePlaceholder: string
    lastNameLabel: string
    lastNamePlaceholder: string
    sendInvitationButton: string
    recentInvitations: string
    emailColumn: string
    nameColumn: string
    statusColumn: string
    dateSentColumn: string
    loadingInvitations: string
    noInvitationsSent: string
    statusPending: string
    statusAccepted: string
    statusDeclined: string
    statusExpired: string
    sendingInvitation: string
    invitationSentSuccess: string
    invitationSentError: string
    // Account Settings
    accountSettingsTitle: string
    accountSettingsSubtitle: string
    generalTab: string
    profileImageTab: string
    notificationsTab: string
    socialLinksTab: string
    personalInformation: string
    accountFirstNameLabel: string
    accountFirstNamePlaceholder: string
    firstNameRequired: string
    accountLastNameLabel: string
    accountLastNamePlaceholder: string
    lastNameRequired: string
    homeAddressLabel: string
    homeAddressPlaceholder: string
    phoneNumberLabel: string
    phoneNumberPlaceholder: string
    phoneNumberRequired: string
    workPhoneLabel: string
    workPhonePlaceholder: string
    privateEmailLabel: string
    privateEmailPlaceholder: string
    workEmailLabel: string
    workEmailPlaceholder: string
    recoveryEmailLabel: string
    recoveryEmailPlaceholder: string
    recoveryEmailNote: string
    recoveryEmailRequired: string
    dateOfBirthLabel: string
    genderLabel: string
    maleOption: string
    femaleOption: string
    titleLabel: string
    titlePlaceholder: string
    professionalPresentationLabel: string
    professionalPresentationPlaceholder: string
    personalPresentationLabel: string
    personalPresentationPlaceholder: string
    cancelButton: string
    saveChangesButton: string
    profileImageTitle: string
    uploadImageText: string
    uploadImageSubtext: string
    selectImageButton: string
    removeUploadButton: string
    chooseAvatarText: string
    saveProfileImageButton: string
    notificationPreferencesTitle: string
    emailNotificationsTitle: string
    emailNotificationsDesc: string
    pushNotificationsTitle: string
    pushNotificationsDesc: string
    smsNotificationsTitle: string
    smsNotificationsDesc: string
    savePreferencesButton: string
    socialLinksTitle: string
    linkedinLabel: string
    xLabel: string
    githubLabel: string
    websiteLabel: string
    saveLinksButton: string
    // Toast messages
    noUserProfileFound: string
    savingProfileImage: string
    profileImageUpdated: string
    failedToUpdateProfile: string
    failedToSaveImage: string
    noImageSelected: string
    fillRequiredFields: string
    savingGeneralSettings: string
    generalSettingsSaved: string
    failedToSaveSettings: string
    savingSocialLinks: string
    socialLinksSaved: string
    failedToSaveSocialLinks: string
    savingNotificationPrefs: string
    notificationPrefsSaved: string
    failedToSaveNotificationPrefs: string
    // Dashboard Profile
    loadingProfile: string
    errorLoadingProfile: string
    noProfileYet: string
    noProfileDescription: string
    yourProfile: string
    created: string
    edit: string
    editCVButton: string
    englishProfile: string
    spanishProfile: string
    frenchProfile: string
    germanProfile: string
  }
  sv: {
    // Navigation
    home: string
    dashboard: string
    profile: string
    myProfile: string
    cv: string
    availability: string
    details: string
    portfolios: string
    featureRequest: string
    sendInvitation: string
    settings: string
    helpSupport: string
    accountSettings: string
    signOut: string
    collapse: string
    expandSidebar: string
    collapseSidebar: string
    // Dashboard Home
    welcomeTitle: string
    welcomeSubtitle: string
    getStarted: string
    step1Title: string
    step1Description: string
    step2Title: string
    step2Description: string
    step3Title: string
    step3Description: string
    step4Title: string
    step4Description: string
    completionMessage: string
    // Technical Skills
    technicalSkills: string
    noSkillsAdded: string
    needProfileForSkills: string
    createProfile: string
    updateProfile: string
    // CV Card
    cvTitle: string
    downloadCV: string
    previewCV: string
    noCVAvailable: string
    createCVFirst: string
    // Feedback Form
    feedbackTitle: string
    feedbackSubtitle: string
    rateExperience: string
    terrible: string
    amazing: string
    perfectTenQuestion: string
    perfectTenPlaceholder: string
    changeRemoveQuestion: string
    changeRemovePlaceholder: string
    submitFeedback: string
    submitting: string
    feedbackSuccess: string
    feedbackError: string
    networkError: string
    selectRating: string
    // Language
    profileLanguage: string
    switchToEnglish: string
    switchToSwedish: string
    // Profile Recommendations
    profileRecommendations: string
    profileCompletion: string
    fieldsCompleted: string
    enhanceProfile: string
    updateField: string
    profileNotCreated: string
    startProfileNow: string
    profileComplete: string
    stayActive: string
    // Feature Request Form
    featureRequestTitle: string
    featureRequestDescription: string
    featureRequestSuccessMessage: string
    featureRequestErrorMessage: string
    featureRequestErrorHelp: string
    featureNameLabel: string
    featureNameHelp: string
    featureNamePlaceholder: string
    featureDescriptionLabel: string
    featureDescriptionHelp: string
    featureDescriptionPlaceholder: string
    experienceRatingLabel: string
    experienceRatingHelp: string
    selectRatingOption: string
    ratingPoor: string
    ratingFair: string
    ratingGood: string
    ratingVeryGood: string
    ratingExcellent: string
    contactInfoLabel: string
    contactInfoHelp: string
    contactInfoPlaceholder: string
    submittingButton: string
    submitButton: string
    noExpiry: string

    // Invitations
    sendInvitations: string
    addInvite: string
    emailLabel: string
    emailPlaceholder: string
    firstNameLabel: string
    firstNamePlaceholder: string
    lastNameLabel: string
    lastNamePlaceholder: string
    sendInvitationButton: string
    recentInvitations: string
    emailColumn: string
    nameColumn: string
    statusColumn: string
    dateSentColumn: string
    loadingInvitations: string
    noInvitationsSent: string
    statusPending: string
    statusAccepted: string
    statusDeclined: string
    statusExpired: string
    sendingInvitation: string
    invitationSentSuccess: string
    invitationSentError: string
    // Account Settings
    accountSettingsTitle: string
    accountSettingsSubtitle: string
    generalTab: string
    profileImageTab: string
    notificationsTab: string
    socialLinksTab: string
    personalInformation: string
    accountFirstNameLabel: string
    accountFirstNamePlaceholder: string
    firstNameRequired: string
    accountLastNameLabel: string
    accountLastNamePlaceholder: string
    lastNameRequired: string
    homeAddressLabel: string
    homeAddressPlaceholder: string
    phoneNumberLabel: string
    phoneNumberPlaceholder: string
    phoneNumberRequired: string
    workPhoneLabel: string
    workPhonePlaceholder: string
    privateEmailLabel: string
    privateEmailPlaceholder: string
    workEmailLabel: string
    workEmailPlaceholder: string
    recoveryEmailLabel: string
    recoveryEmailPlaceholder: string
    recoveryEmailNote: string
    recoveryEmailRequired: string
    dateOfBirthLabel: string
    genderLabel: string
    maleOption: string
    femaleOption: string
    titleLabel: string
    titlePlaceholder: string
    professionalPresentationLabel: string
    professionalPresentationPlaceholder: string
    personalPresentationLabel: string
    personalPresentationPlaceholder: string
    cancelButton: string
    saveChangesButton: string
    profileImageTitle: string
    uploadImageText: string
    uploadImageSubtext: string
    selectImageButton: string
    removeUploadButton: string
    chooseAvatarText: string
    saveProfileImageButton: string
    notificationPreferencesTitle: string
    emailNotificationsTitle: string
    emailNotificationsDesc: string
    pushNotificationsTitle: string
    pushNotificationsDesc: string
    smsNotificationsTitle: string
    smsNotificationsDesc: string
    savePreferencesButton: string
    socialLinksTitle: string
    linkedinLabel: string
    xLabel: string
    githubLabel: string
    websiteLabel: string
    saveLinksButton: string
    // Toast messages
    noUserProfileFound: string
    savingProfileImage: string
    profileImageUpdated: string
    failedToUpdateProfile: string
    failedToSaveImage: string
    noImageSelected: string
    fillRequiredFields: string
    savingGeneralSettings: string
    generalSettingsSaved: string
    failedToSaveSettings: string
    savingSocialLinks: string
    socialLinksSaved: string
    failedToSaveSocialLinks: string
    savingNotificationPrefs: string
    notificationPrefsSaved: string
    failedToSaveNotificationPrefs: string
    // Dashboard Profile
    loadingProfile: string
    errorLoadingProfile: string
    noProfileYet: string
    noProfileDescription: string
    yourProfile: string
    created: string
    edit: string
    editCVButton: string
    englishProfile: string
    spanishProfile: string
    frenchProfile: string
    germanProfile: string
  }
}

// Helper function to map Payload language to Dashboard language
const mapPayloadLanguageToDashboard = (payloadLanguage: Profile['language']): DashboardLanguage => {
  switch (payloadLanguage) {
    case 'en':
      return 'en'
    case 'es':
    case 'fr':
    case 'de':
    case 'zh':
    case 'ja':
    default:
      return 'en' // Default to English for all other languages since sv is not supported in Payload yet
  }
}

// For now, we'll store the dashboard language preference separately from Payload
// until you add 'sv' to your Payload Profile language options
export const useDashboardTranslation = () => {
  const { currentProfile } = useProfileStore()
  const [language, setLanguageState] = useState<DashboardLanguage>('en')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check localStorage for dashboard language preference first
    const savedDashboardLanguage = localStorage.getItem('dashboardLanguage') as DashboardLanguage
    if (
      savedDashboardLanguage &&
      (savedDashboardLanguage === 'en' || savedDashboardLanguage === 'sv')
    ) {
      setLanguageState(savedDashboardLanguage)
    } else if (currentProfile?.language) {
      // Fallback to profile language if no dashboard preference
      const dashboardLanguage = mapPayloadLanguageToDashboard(
        currentProfile.language as 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja',
      )
      setLanguageState(dashboardLanguage)
    }
    setIsInitialized(true)
  }, [currentProfile])

  const setLanguage = useCallback(
    async (newLanguage: DashboardLanguage) => {
      // Update state immediately for instant UI update
      setLanguageState(newLanguage)
      // Store dashboard language preference in localStorage
      localStorage.setItem('dashboardLanguage', newLanguage)

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }))

      // If the new language is supported by Payload, update the profile
      if (newLanguage === 'en' && currentProfile) {
        try {
          const updatedProfile = {
            ...currentProfile,
            language: 'en' as Profile['language'],
          }
          // Update profile store
          const { setProfile } = useProfileStore.getState()
          setProfile(updatedProfile)

          // Save to backend (non-blocking)
          fetch('/api/profile/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'en' }),
          }).catch((error) => {
            console.error('Failed to save language preference:', error)
          })
        } catch (error) {
          console.error('Failed to save language preference:', error)
        }
      }
      // For Swedish, we only store it locally until Payload supports it
    },
    [currentProfile],
  )

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguageState(event.detail)
    }

    window.addEventListener('languageChanged', handleLanguageChange as EventListener)
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
    }
  }, [])

  // Provide both function names for backward compatibility
  const switchLanguage = setLanguage

  const t = dashboardTranslations[language]

  return {
    language,
    setLanguage,
    switchLanguage,
    t,
    isInitialized,
  }
}

export const useDashboardTranslations = useDashboardTranslation
