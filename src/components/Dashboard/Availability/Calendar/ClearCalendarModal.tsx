"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import axios from "axios"
import { Trash2, Loader2 } from "lucide-react"

export function ClearCalendarButton({
    availabilityId,
    onCleared,
}: {
    availabilityId?: string | null // Payload IDs are usually strings
    onCleared: () => void
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleClear = async () => {
        if (!availabilityId) return
        setLoading(true)

        try {
            await axios.delete(`/api/calendar-availability/${availabilityId}`)
            onCleared() // reset local state
            setOpen(false) // only close when done
        } catch (err) {
            console.error("Failed to clear availability:", err)
            alert("Failed to clear calendar. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear Calendar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Clear all selections?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete your saved availability from the
                        calendar. Are you sure you want to continue?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleClear}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Clearing...
                            </>
                        ) : (
                            "Yes, clear it"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
