// SaveChangesConfirmation.tsx
import React from "react";
import Button from "../ReUsable/Button";

interface SaveChangesConfirmationProps {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
    isSaving?: boolean;
}

const SaveChangesConfirmation: React.FC<SaveChangesConfirmationProps> = ({
    isOpen,
    onSave,
    onDiscard,
    onCancel,
    isSaving = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">You have unsaved changes</h3>
                <p className="text-gray-600 mb-6">
                    Do you want to save your changes before leaving?
                </p>
                <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onDiscard}
                        disabled={isSaving}
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={onSave}
                        loading={isSaving}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SaveChangesConfirmation;