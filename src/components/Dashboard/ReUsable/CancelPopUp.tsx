import React from 'react';
import { Icon } from '@iconify/react';
import Button from '../ReUsable/Button';

interface CancelPopUpProps {
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
}

const CancelPopUp: React.FC<CancelPopUpProps> = ({ onConfirm, onCancel, itemName = 'this item' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <Icon
            icon="tabler:alert-circle"
            className="w-12 h-12 text-red-500 mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Confirm Deletion
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete {itemName}? This action cannot be undone.
          </p>

          <div className="flex justify-center gap-4 w-full">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              No, Keep It
            </button>
            <Button
              onClick={onConfirm}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelPopUp;
