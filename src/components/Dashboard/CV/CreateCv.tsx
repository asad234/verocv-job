"use client"
import { useState, useEffect } from "react"
import Card from "../ReUsable/Card"
import Button from "../ReUsable/Button"
import { Icon } from "@iconify/react"
import { useMediaQuery } from "./use-media-query"

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

interface CreateCvProps {
  initialCvItems?: CvItem[]
  onCreateNew?: () => void
  onEditCv?: (cvItem: CvItem) => void
}

const CreateCv = ({ initialCvItems = [], onCreateNew, onEditCv }: CreateCvProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [cvItems, setCvItems] = useState<CvItem[]>([])
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")
  const isMobile = !isTablet

  useEffect(() => {
    setCvItems(initialCvItems)
  }, [initialCvItems])

  const toggleMenu = (id: string) => {
    if (activeMenu === id) {
      setActiveMenu(null)
    } else {
      setActiveMenu(id)
    }
  }

  const getLanguageFlag = (language: string) => {
    switch (language) {
      case "English":
        return "flag:gb-4x3"
      case "French":
        return "flag:fr-4x3"
      case "German":
        return "flag:de-4x3"
      case "Spanish":
        return "flag:es-4x3"
      case "Swedish":
        return "flag:se-4x3"
      default:
        return "tabler:language"
    }
  }

  const handleEditClick = (cvItem: CvItem) => {
    if (onEditCv) {
      onEditCv(cvItem)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest(".dropdown-menu")) {
        setActiveMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeMenu])

  return (
    <div className="flex flex-col w-full max-w-full overflow-hidden">
      {/* Header with Theme */}
      <div className="border-b border-gray-200 py-2 px-3 sm:px-4 mb-2 md:mb-4">
        <div className="text-xs md:text-sm font-medium text-gray-600">
          Theme
          <div className="h-0.5 w-8 md:w-10 bg-green-500 mt-1"></div>
        </div>
      </div>

      <div className="flex w-full">
        {/* Left Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className="w-10 sm:w-12 md:w-16 border-r border-gray-200 flex flex-col items-center pt-2 md:pt-4 shrink-0">
            <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-green-500 text-white rounded-full">
              <span className="text-xs font-bold">CV</span>
            </div>
            <Icon icon="tabler:chevron-right" className="text-gray-400 mt-1 md:mt-2" width={14} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-2 sm:p-3 md:p-4 min-w-0 overflow-x-auto">
          {/* Create new button */}
          <div className="flex justify-end mb-2 md:mb-4 sticky top-0 right-0 z-10">
            <Button
              onClick={onCreateNew}
              className="border border-green-500 hover:bg-green-300 px-2 py-1 md:px-3 md:py-1 rounded flex items-center gap-1 text-xs md:text-sm whitespace-nowrap"
            >
              <Icon icon="tabler:plus" width={14} />
              Create new
            </Button>
          </div>

          {/* CV List */}
          <Card className="border-gray-200 p-0 rounded-md shadow-sm overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            {!isMobile && (
              <div className="hidden md:grid grid-cols-12 gap-2 md:gap-4 py-2 px-2 md:px-4 border-b border-gray-200 text-xs md:text-sm font-medium text-gray-500">
                <div className="col-span-3">TITLE ↓</div>
                <div className="col-span-3">LAST ACTIVITY ↑</div>
                <div className="col-span-3 flex items-center">
                  <span>STATUS ↓</span>
                </div>
                <div className="col-span-2">CREATED ↑</div>
                <div className="col-span-1"></div>
              </div>
            )}

            {/* Table Content */}
            <div className="max-w-full overflow-x-auto">
              {cvItems.length > 0 ? (
                cvItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-4 p-2 sm:p-3 md:py-3 md:px-4 border-b border-gray-100 text-xs md:text-sm hover:bg-gray-50"
                  >
                    {/* Title with language flag */}
                    <div className="col-span-1 md:col-span-3 flex items-center mb-1 md:mb-0">
                      <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-1 md:mr-2 flex-shrink-0">
                        <Icon icon={getLanguageFlag(item.language)} className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <span className="font-medium md:font-normal truncate">{item.title}</span>
                    </div>

                    {/* Last Activity - Stacked on mobile */}
                    <div className="col-span-1 md:col-span-3 text-gray-500">
                      <div className="flex md:block">
                        <span className="md:hidden font-medium mr-1 flex-shrink-0">Last Activity: </span>
                        <span className="truncate">{item.lastActivity}</span>
                      </div>
                      <div className="text-xs truncate">
                        <span className="md:hidden flex-shrink-0">By: </span>
                        {item.lastActivityBy}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 md:col-span-3 my-1 md:my-0">
                      <span
                        className={`inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs ${item.status === "New" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                          }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Created - Stacked on mobile */}
                    <div className="col-span-1 md:col-span-2 text-gray-500">
                      <div className="flex md:block">
                        <span className="md:hidden font-medium mr-1 flex-shrink-0">Created: </span>
                        <span className="truncate">{item.created}</span>
                      </div>
                      <div className="text-xs truncate">
                        <span className="md:hidden flex-shrink-0">By: </span>
                        {item.createdBy}
                      </div>
                    </div>

                    {/* Actions - Right-aligned */}
                    <div className="col-span-1 flex items-center justify-end gap-1 md:gap-2 mt-1 md:mt-0">
                      <button
                        className="h-6 w-6 md:h-8 md:w-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                        onClick={() => handleEditClick(item)}
                        aria-label="Edit CV"
                      >
                        <Icon icon="tabler:pencil" width={14} />
                      </button>
                      <div className="relative dropdown-menu">
                        <button
                          className="h-6 w-6 md:h-8 md:w-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          onClick={() => toggleMenu(item.id)}
                          aria-label="More options"
                        >
                          <Icon icon="tabler:dots-vertical" width={14} />
                        </button>
                        {activeMenu === item.id && (
                          <div className="absolute right-0 mt-1 w-40 md:w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
                            <ul>
                              <li className="px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                Open
                              </li>
                              <li className="px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                Edit file
                              </li>
                              <li className="px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                Copy
                              </li>
                              <li className="px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                Configure CV template
                              </li>
                              <li className="px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-red-700 hover:bg-gray-100 cursor-pointer">
                                Delete
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 md:py-8 text-center text-gray-500 text-sm md:text-base">
                  No CVs created yet. Click CREATE NEW to add a CV.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateCv
