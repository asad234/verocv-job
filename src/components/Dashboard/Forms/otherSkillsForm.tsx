/* "use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useChangesStore } from "@/utils/changesStore"

interface OtherSkillsFormProps {
    onCancel: () => void
    onComplete: () => void
}

export default function OtherSkillsForm({ onCancel, onComplete }: OtherSkillsFormProps) {
    const { otherSkills, setOtherSkills } = useOtherSkillsStore()
    const [skills, setSkills] = useState(otherSkills || "")

    useEffect(() => {
        setSkills(otherSkills || "")
    }, [otherSkills])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSkills(e.target.value)
    }

    const handleSubmit = () => {
        setOtherSkills(skills)
        // Set hasUnsavedChanges to true
        useChangesStore.getState().setHasUnsavedChanges(true)
        onComplete()
    }

    return (
        <div className="space-y-4">
            <h3 className="font-medium text-gray-700 mb-2">Other Skills</h3>

            <textarea
                value={skills}
                onChange={handleChange}
                placeholder="List your other skills here..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
            />

            <div className="flex gap-4">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                    {otherSkills ? "Update" : "Save"}
                </button>
            </div>
        </div>
    )
}
 */