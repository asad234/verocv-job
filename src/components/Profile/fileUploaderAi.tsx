"use client";
//Main file for AI extraction 

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Upload, XCircle, CheckCircle2, Sparkles, Brain } from "lucide-react";
import { useProfileStore } from "@/utils/profileStore"; // Assuming this path is correct
import { toast } from "sonner";
import posthog from "posthog-js";

// Set the workerSrc to point to your local file in the public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-workers/pdf.worker.min.mjs';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  truncated?: boolean;
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ProfilePdfUploaderProps {
  onProfileFilled?: (data: any) => void;
}

const parseDateString = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  } catch (e) {
    return undefined;
  }
};

const convertDatesInProfileData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => convertDatesInProfileData(item));
  } else if (typeof data === 'object' && data !== null) {
    const newObj: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        const isKnownDateField = (
          key === 'startDate' ||
          key === 'endDate' ||
          key === 'validDate' ||
          key === 'completionDate' ||
          key === 'dateOfBirth' ||
          key === 'birthdate'
        );

        if (typeof value === 'string' && isKnownDateField) {
          newObj[key] = parseDateString(value);
        } else if (typeof value === 'object' && value !== null) {
          newObj[key] = convertDatesInProfileData(value);
        } else {
          newObj[key] = value;
        }
      }
    }
    return newObj;
  } else {
    return data;
  }
};

export default function ProfilePdfUploader({ onProfileFilled }: ProfilePdfUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Förbereder...");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const setGlobalProfile = useProfileStore((state) => state.setProfile);
  const setProjects = useProfileStore((state) => state.setProjectDetails);
  const setSkills = useProfileStore((state) => state.setSkills);
  const setLanguages = useProfileStore((state) => state.setLanguages);
  const setReferences = useProfileStore((state) => state.setReferences);
  const setCertifications = useProfileStore((state) => state.setCertifications);
  const setEmployers = useProfileStore((state) => state.setEmployers);
  const setEducation = useProfileStore((state) => state.setEducation);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = (file: File | null) => {
    setError(null);
    setSuccessMessage(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    handleFileSelection(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          setError('Endast PDF-filer stöds.');
          return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`Filstorleken överstiger gränsen på ${MAX_FILE_SIZE_MB}MB.`);
          return;
        }
        handleFileSelection(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          setError('Endast PDF-filer stöds.');
          e.target.value = '';
          return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`Filstorleken överstiger gränsen på ${MAX_FILE_SIZE_MB}MB.`);
          e.target.value = '';
          return;
        }
        handleFileSelection(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  async function handleUploadAndFillProfile() {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setLoadingMessage("Analyserar PDF-filen med AI...");

    try {
      if (!selectedFile) throw new Error('Ingen fil har valts.');
      if (selectedFile.type !== 'application/pdf') throw new Error('Vänligen ladda upp en PDF-fil.');
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) throw new Error(`Filstorleken överstiger gränsen på ${MAX_FILE_SIZE_MB}MB.`);

      // Convert file to ArrayBuffer
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

      // Update state and call callbacks
      setGlobalProfile(profileData);
      setProjects(profileData.projects || []);
      setSkills(profileData.skills || []);
      setLanguages(profileData.languages || []);
      setReferences(profileData.references || []);
      setCertifications(profileData.certifications || []);
      setEmployers(profileData.employers || []);
      setEducation(profileData.education || []);

      if (onProfileFilled) onProfileFilled(profileData);

      toast.success("Profilen fylldes i med data från ditt CV!");
      setSuccessMessage("Profilen fylldes i med data från ditt CV!");

    } catch (err: any) {
      const message = err instanceof Error
        ? err.message
        : 'Ett okänt fel uppstod.';
      console.error("PDF/Upload error:", err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMessage("Förbereder...");
    }
  }


  return (
    <div className="mx-auto p-6 relative">
      <div className="space-y-4">
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium mb-1 text-gray-700">
            Ladda upp ditt CV (PDF)
          </label>
          <div
            className={`border-2 rounded-lg p-8 flex flex-col items-center justify-center transition-colors
                            ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
                            ${selectedFile ? "border-solid bg-gray-50" : "border-dashed"}
                            ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
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
              disabled={loading || !!selectedFile}
            />

            {!selectedFile ? (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-700 text-center">
                  Dra och släpp din fil här (endast PDF stöds i dagsläget), eller <span className="text-blue-600 font-semibold">klicka för att bläddra bland filer</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Max filstorlek: {MAX_FILE_SIZE_MB}MB
                </p>
              </>
            ) : (
              <div className="flex items-center space-x-3 text-gray-800 font-medium">
                <span className="truncate max-w-[calc(100%-40px)]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label="Ta bort vald fil"
                  disabled={loading}
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
              Vår AI för automatisk profilifyllnad är under utveckling. Vi arbetar ständigt för att förbättra dess noggrannhet och funktionalitet för att ge dig en bättre upplevelse.
            </p>
            <button
              type="button"
              onClick={handleUploadAndFillProfile}
              disabled={loading}
              className={`flex items-center justify-center gap-3 w-full max-w-xs bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-semibold transition-colors shadow-lg
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Analyserar...</span>
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6" />
                  <span>Ladda upp & fyll</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[9999]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full relative">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-t-blue-500 border-r-blue-500 animate-spin"></div>
              <div className="absolute inset-0 rounded-full border-4 border-dotted border-b-green-400 border-l-green-400 animate-spin-reverse"></div>
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">{loadingMessage}</p>
            <p className="text-gray-600 text-sm">Vänligen vänta medan processen slutförs.</p>
            <p className="text-gray-500 text-xs mt-1">
              (Detta kan ta en liten stund beroende på filstorleken.)
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center justify-between">
          <p className="font-semibold flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            Fel: {error}
          </p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 ml-4 focus:outline-none"
            aria-label="Stäng felmeddelande"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center justify-between">
          <p className="font-semibold flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {successMessage}
          </p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 ml-4 focus:outline-none"
            aria-label="Stäng bekräftelsemeddelande"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
