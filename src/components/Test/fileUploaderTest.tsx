"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, XCircle, Brain, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
//TODO
// ******************************************************
// CHANGE: Removed global 'pdfjsLib' variable and 'pdfLibLoaded' state.
// The dynamic import now happens inside extractTextFromPdf.
// ******************************************************

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export default function PdfUploadTest() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loadingMessage, setLoadingMessage] = useState("Preparing...")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [extractedData, setExtractedData] = useState<any>(null)
    const [extractedText, setExtractedText] = useState<string>("")

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    // ******************************************************
    // CHANGE: Simplified useEffect - we only ensure client-side existence if necessary, 
    // but the main fix is in `extractTextFromPdf`.
    // The previous pdfjsLib loading logic is REMOVED.
    // ******************************************************
    useEffect(() => {
        // This useEffect is now mostly for cleanup/side-effects if needed, 
        // not for loading the core pdfjsLib dependency itself.
    }, [])

    const handleFileSelection = (file: File | null) => {
        setError(null)
        setSelectedFile(file)
        setExtractedData(null)
        setExtractedText("")
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

    // ******************************************************
    // CHANGE: PDF.js import is now scoped within this function.
    // ******************************************************
    const extractTextFromPdf = async (file: File): Promise<{ text: string; isTruncated: boolean; totalPages: number }> => {
        if (typeof window === "undefined") {
            throw new Error("PDF extraction attempted on server side.")
        }

        // Dynamic import here ensures the code is only executed on the client
        const pdfjsLib = await import("pdfjs-dist") as any;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf-workers/pdf.worker.min.mjs";

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ''
        const maxPagesToParse = Math.min(pdf.numPages, 10)
        const isTruncated = pdf.numPages > maxPagesToParse

        for (let i = 1; i <= maxPagesToParse; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            fullText += `=== Page ${i} ===\n` + textContent.items.map((item: any) => item.str).join(' ') + '\n\n'
        }

        return {
            text: fullText,
            isTruncated,
            totalPages: pdf.numPages
        }
    }

    const handleExtractAndTest = async () => {
        // ******************************************************
        // CHANGE: Removed the unnecessary `pdfLibLoaded` check.
        // ******************************************************

        setError(null)
        setLoading(true)
        setLoadingMessage("Extracting text from PDF...")

        try {
            if (!selectedFile) throw new Error('No file selected')
            if (selectedFile.type !== 'application/pdf') throw new Error('Please upload a PDF file')
            if (selectedFile.size > MAX_FILE_SIZE_BYTES) throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`)

            // Extract raw text first (handles the dynamic import internally)
            const { text, isTruncated, totalPages } = await extractTextFromPdf(selectedFile)
            setExtractedText(text)

            setLoadingMessage("Sending to AI for analysis...")

            // Send to AI API
            const VERCEL_API_URL = "https://job-portal-website-ten.vercel.app/api/extract-profile";

            const res = await fetch(VERCEL_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    extractedText: text,
                    truncated: isTruncated,
                    totalPages: totalPages,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.error || `API error: ${res.status}`)
            }

            if (!data.success) {
                throw new Error(data.error || 'Failed to extract profile data from AI')
            }

            setExtractedData(data.data)
            console.log("Extracted data:", data.data)

        } catch (err: any) {
            const message = err instanceof Error ? err.message : "An unknown error occurred"
            console.error("Extraction Error:", err)
            setError(message)
        } finally {
            setLoading(false)
            setLoadingMessage("Preparing...")
        }
    }

    const downloadExtractedData = () => {
        const dataStr = JSON.stringify(extractedData, null, 2)
        const blob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "extracted-data.json"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const downloadExtractedText = () => {
        const blob = new Blob([extractedText], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "extracted-text.txt"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // ******************************************************
    // CHANGE: Removed the initial "Loading PDF processor..." fallback 
    // as we handle the load dynamically now.
    // ******************************************************

    return (
        <div className="mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">PDF Upload Test Component</h1>
                <p className="text-gray-600">Upload a PDF to test the extraction and see the raw results</p>
            </div>

            <div className="space-y-6">
                {/* File Upload Section */}
                <div>
                    <label htmlFor="pdf-upload-test" className="block text-sm font-medium mb-2 text-gray-700">
                        Upload PDF for Testing
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
                            id="pdf-upload-test"
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
                                    Drag and drop your PDF here, or{" "}
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
                                    disabled={loading}
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {selectedFile && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={handleExtractAndTest}
                            disabled={loading}
                            size="lg"
                            className="flex-1 max-w-md"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    <span>{loadingMessage}</span>
                                </>
                            ) : (
                                <>
                                    <Brain className="w-5 h-5 mr-2" />
                                    <span>Extract & Analyze</span>
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                        <p className="font-semibold flex items-center">
                            <XCircle className="w-5 h-5 mr-2" />
                            Error: {error}
                        </p>
                    </div>
                )}

                {/* Results Display */}
                {extractedData && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Extracted Results</h2>
                            <Button onClick={downloadExtractedData} size="sm" variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Download JSON
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Structured Data */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">Structured Data (AI Analysis)</h3>
                                <div className="bg-gray-50 rounded-lg p-4 border">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                        {JSON.stringify(extractedData, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            {/* Raw Text */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Raw Extracted Text</h3>
                                    <Button onClick={downloadExtractedText} size="sm" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Text
                                    </Button>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                        {extractedText || "No text extracted"}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">Data Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Skills: </span>
                                    <span>{extractedData.skills?.length || 0}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Employers: </span>
                                    <span>{extractedData.employers?.length || 0}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Education: </span>
                                    <span>{extractedData.education?.length || 0}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Projects: </span>
                                    <span>{extractedData.projects?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}