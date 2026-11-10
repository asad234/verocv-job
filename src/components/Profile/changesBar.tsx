/*'use client'

import { useChangesStore, type SectionType } from "@/utils/changesStore";
import { useEffect, useState, useCallback } from "react";
import Button from "../Dashboard/ReUsable/Button";
import { useProfileStore } from "@/utils/profileStore";
import { usePathname, useSearchParams } from "next/navigation";

interface ChangesBarProps {
    onSaveChanges?: () => void;
}

const countChanges = (changes: Record<SectionType, string[]>) => {
    return Object.values(changes).reduce((sum, ids) => sum + ids.length, 0);
};

export const ChangesBar = ({ onSaveChanges }: ChangesBarProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const hasUnsavedChanges = useChangesStore((state) => state.hasUnsavedChanges);
    const resetChanges = useChangesStore((state) => state.resetChanges);
    const initializeFromApi = useProfileStore((state) => state.initializeFromApi);
    const currentProfile = useProfileStore((state) => state.currentProfile);
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const changes = useChangesStore((state) => state.changes);
    const addedCount = countChanges(changes.added);
    const editedCount = countChanges(changes.edited);
    const deletedCount = countChanges(changes.deleted);

    const handleDiscardChanges = () => {
        if (confirm('Are you sure you want to discard all unsaved changes?')) {
            initializeFromApi(currentProfile);
            resetChanges();
        }
    };

    const handleSave = async () => {
        if (!onSaveChanges) {
            console.warn('No onSaveChanges function provided');
            return;
        }

        try {
            setIsSaving(true);
            await onSaveChanges();
            resetChanges();
        } catch (error) {
            console.error('Failed to save changes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Block window unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && !isSaving) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, isSaving]);

    // Block Next.js navigation
    useEffect(() => {
        if (!hasUnsavedChanges || isSaving) return;

        const currentPath = `${pathname}?${searchParams}`;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href && href !== '#' && !href.startsWith('#') && `${pathname}?${searchParams}` !== href) {
                    if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                        e.preventDefault();
                        e.stopPropagation();
                    } else {
                        resetChanges();
                    }
                }
            }
        };

        // Handle form submissions
        const handleFormSubmit = (e: SubmitEvent) => {
            if (!confirm('You have unsaved changes. Are you sure you want to submit?')) {
                e.preventDefault();
            } else {
                resetChanges();
            }
        };

        document.addEventListener('click', handleClick, true);
        document.addEventListener('submit', handleFormSubmit, true);

        return () => {
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('submit', handleFormSubmit, true);
        };
    }, [hasUnsavedChanges, isSaving, pathname, searchParams, resetChanges]);

    // Show/hide the changes bar
    useEffect(() => {
        if (hasUnsavedChanges) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [hasUnsavedChanges]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary shadow-lg p-4 z-50 transition-all duration-300">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-medium text-gray-800">Unsaved Changes</h3>
                    <div className="text-sm text-gray-600 mt-1">
                        {addedCount > 0 && <span>{addedCount} additions</span>}
                        {editedCount > 0 && (
                            <span>{addedCount > 0 ? ", " : ""}{editedCount} edits</span>
                        )}
                        {deletedCount > 0 && (
                            <span>{(addedCount > 0 || editedCount > 0) ? ", " : ""}{deletedCount} deletions</span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        variant="secondary"
                        onClick={handleDiscardChanges}
                        disabled={isSaving}
                    >
                        Discard
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary-dark text-white"
                        onClick={handleSave}
                        disabled={isSaving}
                        variant="primary"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
 */


'use client'

import { useChangesStore, type SectionType } from "@/utils/changesStore"
import { useEffect, useState } from "react"
import Button from "../Dashboard/ReUsable/Button"
import { useProfileStore } from "@/utils/profileStore"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

interface ChangesBarProps {
    onSaveChanges?: () => void;
}

const countChanges = (changes: Record<SectionType, string[]>) => {
    return Object.values(changes).reduce((sum, ids) => sum + ids.length, 0)
}

export const ChangesBar = ({ onSaveChanges }: ChangesBarProps) => {
    const router = useRouter();
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const hasUnsavedChanges = useChangesStore((state) => state.hasUnsavedChanges)
    const resetChanges = useChangesStore((state) => state.resetChanges)
    const initializeFromApi = useProfileStore((state) => state.initializeFromApi)
    const currentProfile = useProfileStore((state) => state.currentProfile)
    const changes = useChangesStore((state) => state.changes)

    const addedCount = countChanges(changes.added)
    const editedCount = countChanges(changes.edited)
    const deletedCount = countChanges(changes.deleted)
    const totalCount = addedCount + editedCount + deletedCount

    const [isSaving, setIsSaving] = useState(false)
    const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false)
    const [showDiscardConfirmDialog, setShowDiscardConfirmDialog] = useState(false)
    const [showLeaveConfirmDialog, setShowLeaveConfirmDialog] = useState(false)

    // Store href pending for navigation after confirmation
    const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null)

    const handleDiscardChangesConfirmed = () => {
        initializeFromApi(currentProfile)
        resetChanges()
        setShowDiscardConfirmDialog(false)
    }

    const handleSave = async () => {
        if (!onSaveChanges) {
            console.warn("No onSaveChanges function provided")
            return
        }

        try {
            setIsSaving(true)
            await onSaveChanges()
            resetChanges()
        } catch (error) {
            console.error("Failed to save changes:", error)
        } finally {
            setIsSaving(false)
            setShowSaveConfirmDialog(false)
        }
    }

    // Beforeunload browser warning for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && !isSaving) {
                e.preventDefault()
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
                return e.returnValue
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [hasUnsavedChanges, isSaving])

    // Intercept link clicks and form submits to show leave confirmation dialog
    useEffect(() => {
        if (!hasUnsavedChanges || isSaving) return

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor) {
                const href = anchor.getAttribute('href');
                if (href && href !== '#' && !href.startsWith('#')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingNavigationHref(href);
                    setShowLeaveConfirmDialog(true);
                }
            }
        };

        const handleFormSubmit = (e: SubmitEvent) => {
            if (!confirm("You have unsaved changes. Are you sure you want to submit?")) {
                e.preventDefault()
            } else {
                resetChanges()
            }
        }

        document.addEventListener("click", handleClick, true)
        document.addEventListener("submit", handleFormSubmit, true)

        return () => {
            document.removeEventListener("click", handleClick, true)
            document.removeEventListener("submit", handleFormSubmit, true)
        }
    }, [hasUnsavedChanges, isSaving, pathname, searchParams, resetChanges])

    if (!hasUnsavedChanges || totalCount === 0) return null

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 w-[320px] max-w-full bg-white border border-gray-300 shadow-2xl rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800">Unsaved Changes</h4>
                        <p className="text-sm text-gray-600">
                            {addedCount} added, {editedCount} edited, {deletedCount} deleted
                        </p>
                    </div>
                    <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {totalCount}
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        className="border-gray-300 text-gray-600 hover:bg-gray-100 px-4 py-2"
                        onClick={() => setShowDiscardConfirmDialog(true)}
                        disabled={isSaving}
                    >
                        Discard
                    </Button>
                    <Button
                        variant="primary"
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2"
                        onClick={() => setShowSaveConfirmDialog(true)}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {/* Save Confirmation Dialog */}
            <Dialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Save</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to save these {totalCount} changes?</p>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setShowSaveConfirmDialog(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discard Confirmation Dialog */}
            <Dialog open={showDiscardConfirmDialog} onOpenChange={setShowDiscardConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discard Changes</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to discard all unsaved changes?</p>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDiscardConfirmDialog(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDiscardChangesConfirmed} disabled={isSaving}>
                            Discard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Page Confirmation Dialog */}
            <Dialog open={showLeaveConfirmDialog} onOpenChange={setShowLeaveConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unsaved Changes</DialogTitle>
                    </DialogHeader>
                    <p>You have unsaved changes. Are you sure you want to leave this page?</p>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowLeaveConfirmDialog(false)
                                setPendingNavigationHref(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (pendingNavigationHref) {
                                    resetChanges()
                                    setShowLeaveConfirmDialog(false)
                                    router.push(pendingNavigationHref)
                                }
                            }}
                        >
                            Leave Page
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
