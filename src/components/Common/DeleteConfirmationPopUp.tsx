"use client";

import React, { useState, useCallback } from 'react';
import type { SectionType } from '@/utils/types';
import { useProfileStore } from '@/utils/profileStore';
import { useChangesStore } from '@/utils/changesStore';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    itemToDelete: { type: SectionType | null; id: string | null };
    onClose: () => void;
    onConfirm: (type: SectionType, id: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    itemToDelete,
    onClose,
    onConfirm,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        if (itemToDelete.type && itemToDelete.id) {
            setIsDeleting(true);
            await onConfirm(itemToDelete.type, itemToDelete.id);
            setIsDeleting(false);
            onClose();
        }
    };

    if (!isOpen || !itemToDelete.type || !itemToDelete.id) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-md shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="mb-4">
                    Are you sure you want to delete this {itemToDelete.type?.slice(0, -1)}?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DeleteConfirmationHookResult {
    isDeleteDialogOpen: boolean;
    itemToDelete: { type: SectionType | null; id: string | null };
    openDeleteDialog: (type: SectionType, id: string) => void;
    closeDeleteDialog: () => void;
    DeleteConfirmationModalComponent: React.FC<
        Omit<DeleteConfirmationModalProps, 'onConfirm'>
    >;
}

export const useDeleteConfirmation = (): DeleteConfirmationHookResult => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
        type: SectionType | null;
        id: string | null;
    }>({ type: null, id: null });

    const removeItem = useProfileStore((state) => state.removeItem);
    const { removeChange, deleteChange } = useChangesStore();

    const openDeleteDialog = useCallback((type: SectionType, id: string) => {
        setItemToDelete({ type, id });
        setIsDeleteDialogOpen(true);
    }, []);

    const closeDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
        // Don't reset itemToDelete immediately to avoid flash before animation completes
        setTimeout(() => setItemToDelete({ type: null, id: null }), 300);
    }, []);

    const handleConfirmDelete = useCallback(
        async (type: SectionType, id: string) => {
            // Check if this was a newly added item
            const changes = useChangesStore.getState().changes;
            const wasAdded = changes.added[type].includes(id);

            // Remove from profile store
            await removeItem(type, id);

            // Update changes store
            if (wasAdded) {
                // If it was added but not saved, just remove from added changes
                removeChange(type, id);
            } else {
                // If it was an existing item, mark as deleted
                deleteChange(type, id);
            }
        },
        [removeItem, removeChange, deleteChange]
    );

    const DeleteConfirmationModalComponent = useCallback(
        (props: Omit<DeleteConfirmationModalProps, 'onConfirm'>) => (
            <DeleteConfirmationModal
                {...props}
                onConfirm={handleConfirmDelete}
                itemToDelete={itemToDelete}
            />
        ),
        [handleConfirmDelete, itemToDelete]
    );

    return {
        isDeleteDialogOpen,
        itemToDelete,
        openDeleteDialog,
        closeDeleteDialog,
        DeleteConfirmationModalComponent,
    };
};