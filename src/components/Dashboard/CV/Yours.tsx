"use client"
import { useState, useRef } from "react"
import type React from "react"

import Card from "../ReUsable/Card"
import Button from "../ReUsable/Button"
import { Icon } from "@iconify/react"
import CreateCv from "./CreateCv"
import EditCv from "./EditCv"

// Define CV item type
type CvItem = {
  id: string
  title: string
  language: string
  lastActivity: string
  lastActivityBy: string
  status: string
  created: string
  createdBy: string
}

const Yours = () => {
  const [showCVForm, setShowCVForm] = useState(false)
  const [showCreateCv, setShowCreateCv] = useState(false)
  const [showEditCv, setShowEditCv] = useState(false)
  const [selectedCv, setSelectedCv] = useState<CvItem | undefined>(undefined)
  const [formData, setFormData] = useState({
    title: "",
    language: "",
  })
  const [cvList, setCvList] = useState<CvItem[]>([])

  const formRef = useRef<HTMLDivElement>(null)
  const createCvRef = useRef<HTMLDivElement>(null)
  const editCvRef = useRef<HTMLDivElement>(null)

  const handleCreateCV = () => {
    setShowCVForm(true)
    setShowCreateCv(false)
    setShowEditCv(false)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Format current date and time
    const now = new Date()
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    // Create a new CV
    const newCV = {
      id: Math.random().toString(36).substring(2, 9),
      title: formData.title,
      language: formData.language,
      lastActivity: formattedDate,
      lastActivityBy: "Georg Nordström",
      status: "New",
      created: formattedDate,
      createdBy: "Abdullahi Asad",
    }

    setCvList([...cvList, newCV])
    setFormData({ title: "", language: "" })
    setShowCVForm(false)
    setShowCreateCv(true)

    setTimeout(() => {
      createCvRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleEditCv = (cvItem: CvItem) => {
    setSelectedCv(cvItem)
    setShowEditCv(true)

    setTimeout(() => {
      editCvRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSaveEdit = (updatedCv: CvItem) => {
    // Update the CV in the list
    const updatedList = cvList.map((cv) => (cv.id === updatedCv.id ? updatedCv : cv))

    setCvList(updatedList)
    setShowEditCv(false)
  }

  const handleCancelEdit = () => {
    setShowEditCv(false)
    setSelectedCv(undefined)
  }

  const isFormValid = formData.title.trim() !== "" && formData.language !== ""

  // If showing the CV management view
  if (showCreateCv) {
    return (
      <div className="w-full">
        <div ref={createCvRef}>
          <CreateCv initialCvItems={cvList} onCreateNew={handleCreateCV} onEditCv={handleEditCv} />

          {showEditCv && (
            <div ref={editCvRef} className="flex-1 p-4 ml-16">
              <EditCv cvItem={selectedCv} onSave={handleSaveEdit} onCancel={handleCancelEdit} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-4/5 max-w-4xl">
        <Card className="mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">CV</h2>
              <div className="w-5 h-5 bg-blue-400 rounded-md flex items-center justify-center">
                <Icon icon="tabler:plus" className="w-4 h-4 text-white" />
              </div>
            </div>
            <Icon icon="tabler:dots-vertical" className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Create and manage your CVs to showcase your professional experience, skills, and qualifications.
          </p>

          <div className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
            <div className="relative w-48 h-28 bg-white rounded-md flex items-center justify-center border border-gray-200 shadow-sm">
              <div className="w-full h-full flex items-center justify-center">
                <Icon icon="tabler:file-cv" className="w-12 h-12 text-gray-300" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <Icon icon="tabler:plus" className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            <p className="text-gray-600 mt-6 flex items-center gap-2 font-medium">
              There are no CVs yet
              <span className="text-amber-500">
                <Icon icon="tabler:wave" className="w-5 h-5" />
              </span>
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleCreateCV}
              className="bg-blue-400 hover:bg-blue-700 text-white px-6 py-2 font-medium
              transition-colors duration-200 flex items-center gap-2 rounded-xl"
            >
              <Icon icon="tabler:plus" className="w-4 h-4" />
              Create New CV
            </Button>
          </div>
        </Card>

        {/* CV Creation Form */}
        {showCVForm && (
          <Card id="cv-form" className="mt-8">
            <div ref={formRef} className="flex items-center mb-4">
              <Icon icon="tabler:file-text" className="w-8 h-8 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold">Create a new CV for Namn På Personen</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              The CV is a presentation of the profile that can be customized for a specific need.
            </p>

            <form className="space-y-6" onSubmit={handleFormSubmit}>
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Select CV language <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    required
                  >
                    <option value="">Select a language</option>
                    <option value="English">English</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Swedish">Swedish</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <Icon icon="tabler:chevron-down" className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className={`px-6 py-2 font-medium rounded ${isFormValid
                    ? "bg-green-500 hover:bg-blue-600 text-white"
                    : "bg-blue-100 text-white cursor-not-allowed"
                    }`}
                  disabled={!isFormValid}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCVForm(false)}
                  className="bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 px-6 py-2 font-medium rounded"
                >
                  Close
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Yours
