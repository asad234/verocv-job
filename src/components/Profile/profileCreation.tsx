"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUserProfileData } from "@/hooks/profile/useProfileData";
import { useProfileMutations } from "@/hooks/profile/useProfileMutations";
import LanguageSelector from "@/components/Profile/languageSelector";
import ProfileSummary from "@/components/Profile/profileSummary";
import { useProfileStore } from "@/utils/profileStore";
import { toast } from "sonner";
import type {
  Language,
  SingleProfileResponse,
  Profile,
} from "@/types/payloadTypes";
import { ChangesBar } from "./changesBar";
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore";
import ProfileCreationUploader from "./Profilecreationuploader";
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation";
import { useProfileById } from "@/hooks/profile/useProfileById";

interface ProfileCreationProps {
  userId: string;
  profileId?: string;
  type?: "create" | "edit";
}

export default function ProfileCreation({ userId, profileId, type = "create" }: ProfileCreationProps) {
  const router = useRouter();
  const { t } = useDashboardTranslation();
  const {
    profile: fetchedProfile,
    isLoading: isProfileLoading,
    mutate: refetchProfile,
  } = useProfileById(type === "edit" ? profileId : null, {
    revalidateOnMount: true,
  });
  const { createProfile, updateProfile, isCreatingProfile, isUpdatingProfile } = useProfileMutations();
  const setGlobalProfile = useProfileStore((state) => state.setProfile);
  const currentGlobalProfile = useProfileStore((state) => state.currentProfile);
  const setPersonalInfo = usePersonalInfoStore((state) => state.setPersonalInfo);

  const [showSummary, setShowSummary] = useState(type === "edit");
  const { setProfileLanguage } = useProfileStore();
  const [fileSelected, setFileSelected] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const resetChanges = useProfileStore((state) => state.resetChanges);

  useEffect(() => {
    // Reset changes when leaving page
    return () => {
      resetChanges();
    };
  }, [resetChanges]);

  useEffect(() => {
    console.log("fetchedProfile in useEffect:", fetchedProfile);
    if (type === "edit" && fetchedProfile) {
      setGlobalProfile(fetchedProfile);
      console.log("setGlobalProfile called with:", fetchedProfile);
      setProfileLanguage(getLanguageName(fetchedProfile.language || "en"));
    } else if (type === "create") {
      setGlobalProfile({
        id: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        language: fetchedProfile?.language
          ? (getLanguageCode(fetchedProfile.language) as 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'sv')
          : "en",
        user: Number(userId),
        availabilityInformation: null,
        personalInformation: {
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          id: "",
          user: 0,
          createdAt: "",
          updatedAt: ""
        },
        profileDetails: {
          projects: [],
          employers: [],
          personalInfo: undefined,
          skills: [],
          references: [],
          certifications: [],
          experience: [],
          education: [],
          languages: [],
        },
      });
    }
  }, [fetchedProfile, type, setGlobalProfile, userId, setProfileLanguage]);

  useEffect(() => {
    if (type === "edit" && userId) {
      refetchProfile();
    }
  }, [type, userId, refetchProfile]);

  useEffect(() => {
    console.log("currentGlobalProfile in component:", currentGlobalProfile);
  }, [currentGlobalProfile]);

  const handleSaveProfile: () => Promise<SingleProfileResponse | undefined> = async () => {
    if (!userId) {
      toast.error("Error", { description: "User ID is required", duration: 3000 });
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const latestProfileState = useProfileStore.getState().currentProfile;
      const currentPersonalInformation = usePersonalInfoStore.getState().personalInfo;
      const currentSkills = useProfileStore.getState().skills;
      const currentProjectDetails = useProfileStore.getState().projectDetails;
      const currentReferences = useProfileStore.getState().references;
      const currentCertifications = useProfileStore.getState().certifications;
      const currentEmployers = useProfileStore.getState().employers;
      const currentEducation = useProfileStore.getState().education;
      const currentLanguages = useProfileStore.getState().languages;
      const currentProfileLanguage = useProfileStore.getState().currentProfile?.language;

      if (!latestProfileState) {
        toast.error("Error", { description: "No profile data to save", duration: 3000 });
        return;
      }

      setPersonalInfo(currentPersonalInformation);
      const payload: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> = {
        ...latestProfileState,
        user: Number(userId),
        language: currentProfileLanguage! as 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja',
        personalInformation: currentPersonalInformation!,
        profileDetails: {
          skills: currentSkills ? JSON.parse(JSON.stringify(currentSkills)) : [],
          projects: currentProjectDetails ? JSON.parse(JSON.stringify(currentProjectDetails)) : [],
          references: currentReferences ? JSON.parse(JSON.stringify(currentReferences)) : [],
          certifications: currentCertifications ? JSON.parse(JSON.stringify(currentCertifications)) : [],
          experience: currentEmployers ? JSON.parse(JSON.stringify(currentEmployers)) : [],
          employers: currentEmployers ? JSON.parse(JSON.stringify(currentEmployers)) : [],
          education: currentEducation ? JSON.parse(JSON.stringify(currentEducation)) : [],
          languages: currentLanguages ? JSON.parse(JSON.stringify(currentLanguages)) : [],
        },
      };

      let result: SingleProfileResponse | undefined;
      if (type === "create") {
        result = await createProfile(payload);
        if (result?.id) {
          toast.success("Success", { description: "Profile created successfully!", duration: 3000 });
          // ✅ Use cache-busting redirect for create
          setTimeout(() => {
            window.location.replace(`/dashboard/profile?refresh=${Date.now()}`);
          }, 1000);
        }
      } else {
        if (profileId) {
          result = await updateProfile(profileId, payload);
        } else if (fetchedProfile?.id) {
          result = await updateProfile(fetchedProfile.id.toString(), payload);
        } else {
          toast.error("Error", { description: "Profile ID not found for update", duration: 3000 });
          return;
        }
        toast.success("Success", { description: "Saved Successfully!!", duration: 3000 });
      }

      return result;

    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Error", { description: "Failed to save changes", duration: 3000 });
      setSaveError(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    setShowSummary(true);
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const getLanguageCode = (language: string): 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' => {
    const languageMap: Record<string, 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'> = {
      English: "en",
      Spanish: "es",
      French: "fr",
      German: "de",
      Chinese: "zh",
      Japanese: "ja",
    };
    return languageMap[language] || "en";
  };

  const getLanguageName = (code: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'sv'): string => {
    const codeMap: Record<'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'sv', string> = {
      en: "English",
      sv: "Swedish",
      es: "Spanish",
      fr: "French",
      de: "German",
      zh: "Chinese",
      ja: "Japanese",
    };
    return codeMap[code] || "English";
  };

  if ((type === "edit" && isProfileLoading) || (type === "create" && isCreatingProfile)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10  animate-spin"
          style={{ color: 'rgb(5, 22, 80)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <ChangesBar onSaveChanges={handleSaveProfile} />

      <div className="flex items-center mb-6">
        <button onClick={() => router.replace('/dashboard/profile')} className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.back}
        </button>
      </div>

      {type === "create" && !fetchedProfile && !showSummary && (
        <div className="space-y-6">
          {/* ✅ CV Upload Section */}
          <ProfileCreationUploader
            onProfileFilled={handleContinue}
            onFileSelected={setFileSelected}
          />

          {!fileSelected && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">{t.orBuildFromScratch}</span>
                </div>
              </div>

              {/* Manual Creation Section */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: 'rgb(5, 22, 80)' }}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(5, 22, 80, 0.1)' }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: 'rgb(5, 22, 80)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-800 mb-2">
                      {t.buildYourCareerFoundation}
                    </h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {t.profileIsHeartOfJobSearch}
                    </p>

                    {/* Features list */}
                    {/* Features list */}
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start text-sm text-gray-700">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: 'rgb(5, 22, 80)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t.generateTailoredCVs}</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: 'rgb(5, 22, 80)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t.showcaseExperienceProfessionally}</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-700">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: 'rgb(5, 22, 80)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{t.standOutToEmployers}</span>
                      </li>
                    </ul>

                    {/* Animated Button */}
                    <button
                      onClick={handleContinue}
                      className="relative w-full overflow-hidden flex items-center justify-center gap-2 text-white font-medium py-3 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg group"
                      style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                      disabled={isProfileLoading || isCreatingProfile}
                    >
                      {/* Shimmer Effect */}
                      <div
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
                        }}
                      />

                      {(isProfileLoading || isCreatingProfile) ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                          <span className="relative z-10">Loading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 relative z-10 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="relative z-10">{t.startCreatingYourProfile}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showSummary && (
        <>
          <div ref={summaryRef} className="mb-6">
            <ProfileSummary
              mode={type === "create" ? "create" : "edit"}
              onComplete={handleSaveProfile}
            />
            {saveError && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                {saveError}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
