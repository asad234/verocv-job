"use client"

import UnderDevelopmentBanner from "@/components/Common/underDevelopment"
import { Button } from "@/components/Dashboard/Availability/Calendar/CalendarButton"
import { Label } from "@/components/Dashboard/Availability/Calendar/CalendarLabel"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
import axios from "axios"
import { useEffect, useState } from "react"
import YearCalendar from "./Calendar/WeekCalendar"
import { useSession } from "next-auth/react"

type DateStatus = "booked" | "available" | "vacation" | "none"

// Helper: normalize to YYYY-MM-DD
const formatDateKey = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function CalendarFormPage() {
  const { t } = useDashboardTranslation()
  const { data: session, status } = useSession()
  const userId = session?.user?.id

  const [selectedDates, setSelectedDates] = useState<Record<string, DateStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [calendarId, setCalendarId] = useState<number | null>(null)

  // Fetch availability
  useEffect(() => {
    if (status !== "authenticated" || !userId) return
    const fetchAvailabilityData = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/calendar-availability?userId=${userId}`)
        const docs = response.data.docs || []
        const initialSelectedDates: Record<string, DateStatus> = {}

        if (docs.length > 0) {
          docs[0].dateStatus.forEach((item: { date: string; status: DateStatus }) => {
            initialSelectedDates[formatDateKey(item.date)] = item.status
          })

          setCalendarId(docs[0].id)
        } else {
          // no availability yet
          setCalendarId(null)
        }

        setSelectedDates(initialSelectedDates)
        setError(null)
      } catch (err) {
        console.error("Error fetching availability:", err)
        setError("t.failedToLoadAvailability")
      } finally {
        setLoading(false)
      }
    }

    fetchAvailabilityData()
  }, [status, userId, year, t])

  const statusColorClasses: Record<DateStatus, string> = {
    available: "bg-green-100 border-green-300",
    vacation: "bg-red-100 border-red-300",
    booked: "bg-blue-100 border-blue-300",
    none: "bg-gray-100 border-gray-300",
  }

  const statusCounts = Object.values(selectedDates).reduce<Record<string, number>>((acc, status) => {
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const statusEntries = Object.entries(statusColorClasses)


  const handleDateSelect = (date: string, status: DateStatus | null) => {
    setSelectedDates((prev) => {
      const newDates = { ...prev }
      if (status === null) delete newDates[date]
      else newDates[date] = status
      return newDates
    })
  }

  const handleSubmit = async () => {
    if (!userId) return alert(t.userProfileNotFound)

    const payloadDateStatus = Object.entries(selectedDates).map(([date, status]) => ({
      date,
      status,
    }))

    try {
      await axios.post("/api/calendar-availability", {
        user: userId,
        dateStatus: payloadDateStatus,
      })
      alert(t.availabilitySavedSuccess)
    } catch (err) {
      console.error(err)
      alert(t.failedToSaveAvailability)
    }
  }


  if (loading) return <div className="container mx-auto py-8 px-4">{t.loadingAvailability}</div>
  if (error) return <div className="container mx-auto py-8 px-4 text-red-500">{error}</div>

  return (
    <div className="container mx-auto py-8 px-4">
      <UnderDevelopmentBanner />
      <h1 className="text-2xl font-bold mb-6">{t.availabilityCalendar}</h1>
      <div className="space-y-6">
        <div className="border-blue-700 rounded-xl overflow-hidden shadow-2xl">
          <YearCalendar
            calendarId={calendarId}
            initialYear={year}
            onDateSelect={handleDateSelect}
            initialDateStatuses={selectedDates}
            translations={{
              today: t.todayButton,
              available: t.available,
              vacation: t.vacation,
              booked: t.booked,
              clear: t.clearButton,
              showWeekNumbers: t.showWeekNumbers,
              dragToSelectMultiple: t.dragToSelectMultiple,
              none: "None",
            }}
          />
        </div>
        {Object.keys(selectedDates).length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {statusEntries
                .filter(([status]) => status === "booked" || status === "vacation")
                .map(([status, colorClass]) => (
                  <div key={status} className="bg-gray-50 p-3 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${colorClass}`} />
                      <span className="font-medium capitalize">
                        {t[status as keyof typeof t] || status}
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {statusCounts[status] || 0}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        {t.days || "days"}
                      </span>
                    </div>
                  </div>
                ))}

            </div>
            {/*
            <div className="bg-white rounded-lg border p-3">
              <p className="font-medium text-gray-700 mb-2">{t.selectedDates || "Selected Dates"}</p>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(selectedDates)
                  .slice(0, 6)
                  .map(([date, status]) => (
                    <div key={date} className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${statusColorClasses[status] || statusColorClasses.none}`}
                      />
                      <span className="text-sm">
                        {date}{" "}
                        <span className="text-gray-500 capitalize">({t[status as keyof typeof t] || status})</span>
                      </span>
                    </div>
                  ))}
                {Object.keys(selectedDates).length > 6 && (
                  <div className="text-sm text-gray-500">
                    +{Object.keys(selectedDates).length - 6} {t.moreDates || "more dates"}
                  </div>
                )}
              </div>
            </div> */}
          </div>
        )}
        <Button className="rounded-xl" onClick={handleSubmit}>{t.saveButton}</Button>
      </div>
    </div>
  )
}
