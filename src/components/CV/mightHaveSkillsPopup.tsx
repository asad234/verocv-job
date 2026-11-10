"use client" //todo: translattion

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { MightHaveSkill } from "@/types/payloadTypes"
import { toast as toastS } from "sonner"

interface SkillState {
    skillRating?: number
    skillYearsExperience?: number
}

interface MightHaveSkillsPopupProps {
    open: boolean
    onClose: () => void
    skills: MightHaveSkill[]
    onSave: (selected: { skillName: string; skillRating?: number; skillYearsExperience?: number }[]) => void
}

export default function MightHaveSkillsPopup({
    open,
    onClose,
    skills,
    onSave,
}: MightHaveSkillsPopupProps) {
    const [selectedSkills, setSelectedSkills] = useState<Record<string, SkillState>>({})

    const handleCheckboxChange = (skillName: string, checked: boolean) => {
        setSelectedSkills((prev) => {
            const updated = { ...prev }
            if (checked) {
                updated[skillName] = updated[skillName] || { skillRating: 3, skillYearsExperience: 1 }
            } else {
                delete updated[skillName]
            }
            return updated
        })
    }

    const handleYearsChange = (skillName: string, skillYearsExperience: string) => {
        setSelectedSkills((prev) => ({
            ...prev,
            [skillName]: {
                ...prev[skillName],
                skillYearsExperience: skillYearsExperience === "" ? 1 : Number(skillYearsExperience)
            },
        }))
    }


    const handleRatingChange = (skillName: string, value: number[]) => {
        setSelectedSkills((prev) => ({
            ...prev,
            [skillName]: { ...prev[skillName], skillRating: value[0] },
        }))
    }

    const handleSave = () => {
        const selected = Object.entries(selectedSkills).map(([skillName, { skillRating, skillYearsExperience }]) => ({
            skillName,
            skillRating,
            skillYearsExperience,
        }))
        // Show toast with number of selected skills
        toastS.info(`Added ${selected.length} suggested skills to current CV`, {
            duration: 4000,
            position: "top-center",
        })
        console.log("saving", selected);
        onSave(selected)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl rounded-2xl shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Do you have experience with these skills?
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[430px] overflow-y-auto pr-2">
                    {skills.map((skill, i) => {
                        const checked = skill.skillName in selectedSkills
                        const current = selectedSkills[skill.skillName] || { skillRating: 3, skillYearsExperience: 1 }

                        // Format relevance
                        const formattedRelevance = skill.relevance.replace(/_/g, " ")
                        const relevanceDisplay = formattedRelevance.charAt(0).toUpperCase() + formattedRelevance.slice(1)

                        return (
                            <div
                                key={i}
                                className={`border rounded-xl p-4 flex flex-col gap-3 transition-all ${checked ? "bg-muted/30 border-primary" : "bg-muted/10"
                                    }`}
                            >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`skill-${i}`}
                                            checked={checked}
                                            onCheckedChange={(c) => handleCheckboxChange(skill.skillName, !!c)}
                                        />
                                        <Label htmlFor={`skill-${i}`} className="font-medium text-base">
                                            {skill.skillName}
                                        </Label>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md capitalize">
                                        {relevanceDisplay}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground">{skill.reason}</p>

                                {checked && (
                                    <div className="space-y-4 mt-2">
                                        {/* Skill Level Slider */}
                                        <div className="space-y-2">
                                            <Label>
                                                Skill Level: {current.skillRating} {current.skillRating === 1 ? "Star" : "Stars"}
                                            </Label>
                                            <Slider
                                                min={1}
                                                max={5}
                                                step={1}
                                                value={[current.skillRating || 3]}
                                                onValueChange={(val) => handleRatingChange(skill.skillName, val)}
                                                className="py-2"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Beginner</span>
                                                <span>Intermediate</span>
                                                <span>Expert</span>
                                            </div>
                                        </div>

                                        {/* Years of Experience */}
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm">Years:</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                className="w-20 h-8"
                                                value={current.skillYearsExperience || 1}
                                                onChange={(e) => handleYearsChange(skill.skillName, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Selected</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
