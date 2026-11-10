"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, XCircle, Sparkles, Brain } from "lucide-react"
import { useProfileStore } from "@/utils/profileStore"
import { useProfileMutations } from "@/hooks/profile/useProfileMutations"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import posthog from "posthog-js"

// Dynamic import to prevent SSR issues
const pdfjsLib: any = null

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface OnboardingPdfUploaderProps {
  userId: string
  onProfileCreated: (data: any) => void
}

const parseDateString = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? undefined : date
  } catch (e) {
    return undefined
  }
}

const convertDatesInProfileData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map((item) => convertDatesInProfileData(item))
  } else if (typeof data === "object" && data !== null) {
    const newObj: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key]
        const isKnownDateField =
          key === "startDate" ||
          key === "endDate" ||
          key === "validDate" ||
          key === "completionDate" ||
          key === "dateOfBirth" ||
          key === "birthdate"

        if (typeof value === "string" && isKnownDateField) {
          newObj[key] = parseDateString(value)
        } else if (typeof value === "object" && value !== null) {
          newObj[key] = convertDatesInProfileData(value)
        } else {
          newObj[key] = value
        }
      }
    }
    return newObj
  } else {
    return data
  }
}

export default function OnboardingPdfUploader({ userId, onProfileCreated }: OnboardingPdfUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("Preparing...")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { createProfile, isCreatingProfile } = useProfileMutations()
  const { personalInfo } = usePersonalInfoStore()
  const {
    setProfile,
    setProjectDetails,
    setSkills,
    setLanguages,
    setReferences,
    setCertifications,
    setEmployers,
    setEducation,
  } = useProfileStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelection = (file: File | null) => {
    setError(null)
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    handleFileSelection(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file) {
        if (file.type !== "application/pdf") {
          setError("Only PDF files are supported.")
          return
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`)
          return
        }
        handleFileSelection(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file) {
        if (file.type !== "application/pdf") {
          setError("Only PDF files are supported.")
          e.target.value = ""
          return
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`)
          e.target.value = ""
          return
        }
        handleFileSelection(file)
      }
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleUploadAndCreateProfile = async () => {
    if (!pdfjsLib) {
      setError("PDF processor not loaded. Please refresh the page.");
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingMessage("Analyserar PDF-filen med AI...");

    try {
      if (!selectedFile) throw new Error('Ingen fil har valts.');
      if (selectedFile.type !== 'application/pdf') throw new Error('Vänligen ladda upp en PDF-fil.');
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) throw new Error(`Filstorleken överstiger gränsen på ${MAX_FILE_SIZE_MB}MB.`);

      // Convert file to ArrayBuffer directly
      const arrayBuffer = await selectedFile.arrayBuffer();
      setLoadingMessage("Tolkar PDF-innehåll...");

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      let isTruncatedClientSide = false;
      const maxPagesToParse = Math.min(pdf.numPages, 10);

      if (pdf.numPages > maxPagesToParse) isTruncatedClientSide = true;

      for (let i = 1; i <= maxPagesToParse; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }

      setLoadingMessage("Skickar data till AI för att extrahera profil...");

      const VERCEL_API_URL = "https://job-portal-website-ten.vercel.app/api/extract-profile";
      let data;

      try {
        const res = await fetch(VERCEL_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extractedText: fullText,
            truncated: isTruncatedClientSide,
            totalPages: pdf.numPages,
          }),
        });

        data = await res.json();

        if (!res.ok) {
          posthog.capture("resume_parse_error", {
            source: "Vercel API",
            status: res.status,
            message: data?.error || "Unknown API error",
            details: data?.details || null,
            truncated: isTruncatedClientSide,
            pages: pdf.numPages,
          });
          throw new Error(data?.error || "Unknown API error");
        }

        posthog.capture("resume_parse_success", {
          pages: pdf.numPages,
          truncated: isTruncatedClientSide,
        });
      } catch (networkErr: any) {
        console.error("Network error:", networkErr);
        posthog.capture("resume_parse_error", {
          source: "Vercel API",
          status: "network_error",
          message: networkErr.message || "Unknown network error",
          truncated: isTruncatedClientSide,
          pages: pdf.numPages,
        });
        throw networkErr;
      }

      if (!data.success) throw new Error(data.error || 'Kunde inte extrahera profildata från AI.');

      const profileData = convertDatesInProfileData(data.data);
      setLoadingMessage("Creating your profile...");

      const profilePayload = {
        language: "en" as const,
        personalInformation: personalInfo || {
          user: Number(userId),
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
        },
        profileDetails: {
          skills: profileData.skills || [],
          projectDetails: profileData.projects || [],
          references: profileData.references || [],
          certifications: profileData.certifications || [],
          employers: profileData.employers || [],
          education: profileData.education || [],
          languages: profileData.languages || [],
        },
      };

      const result = await createProfile(profilePayload);

      if (result) {
        setProfile(result);
        setProjectDetails(profileData.projects || []);
        setSkills(profileData.skills || []);
        setLanguages(profileData.languages || []);
        setReferences(profileData.references || []);
        setCertifications(profileData.certifications || []);
        setEmployers(profileData.employers || []);
        setEducation(profileData.education || []);

        toast.success("Profile created successfully from your CV!");
        onProfileCreated(result);
      }

    } catch (err: any) {
      let message = "An unknown error occurred.";
      if (err instanceof Error) {
        if (err.message.includes("Invalid PDF")) {
          message = "The uploaded file is not a valid PDF.";
        } else if (err.message.includes("password")) {
          message = "Password-protected PDFs are not supported.";
        } else if (err.message.includes("No text content")) {
          message = "No text found in PDF. Please ensure your CV contains selectable text.";
        } else {
          message = err.message;
        }
      }
      console.error("Upload/Create Profile Error:", err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMessage("Preparing...");
    }
  };

  const isProcessing = loading || isCreatingProfile

  return (
    <div className="mx-auto p-6 relative">
      <div className="space-y-4">
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium mb-1 text-gray-700">
            Upload your CV (PDF)
          </label>
          <div
            className={`border-2 rounded-lg p-8 flex flex-col items-center justify-center transition-colors
              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
              ${selectedFile ? "border-solid bg-gray-50" : "border-dashed"}
              ${isProcessing ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              id="pdf-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="application/pdf"
              disabled={isProcessing || !!selectedFile}
            />

            {!selectedFile ? (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-700 text-center">
                  Drag and drop your file here (PDF only), or{" "}
                  <span className="text-blue-600 font-semibold">click to browse files</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Max file size: {MAX_FILE_SIZE_MB}MB</p>
              </>
            ) : (
              <div className="flex items-center space-x-3 text-gray-800 font-medium">
                <span className="truncate max-w-[calc(100%-40px)]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile()
                  }}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label="Remove selected file"
                  disabled={isProcessing}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="flex flex-col items-center mt-4 gap-4 w-full px-4">
            <p className="text-sm text-gray-700 text-center leading-relaxed w-full max-w-full">
              Our AI will analyze your CV and automatically create your profile with the extracted information.
            </p>
            <Button
              onClick={handleUploadAndCreateProfile}
              disabled={isProcessing}
              size="lg"
              className="w-full max-w-xs"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6 mr-2" />
                  <span>Upload & Create Profile</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[9999]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full relative">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-t-blue-500 border-r-blue-500 animate-spin"></div>
              <div className="absolute inset-0 rounded-full border-4 border-dotted border-b-green-400 border-l-green-400 animate-spin-reverse"></div>
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">{loadingMessage}</p>
            <p className="text-gray-600 text-sm">Please wait while we process your CV.</p>
            <p className="text-gray-500 text-xs mt-1">(This may take a moment depending on file size.)</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center justify-between">
          <p className="font-semibold flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            Error: {error}
          </p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 ml-4 focus:outline-none"
            aria-label="Close error message"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
