"use client"
import React, { useCallback } from 'react';
import { Icon } from '@iconify/react';
import Language from '@/components/Dashboard/ReUsable/Language';

const DragDrop = () => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      // Handle file upload logic here
    }
  }, []);

  return (
    <div className="flex justify-center items-center w-full mt-10">
      <div className="w-full lg:w-[50%] space-y-4 sm:space-y-6">
        {/* Drag & Drop Card */}
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
          {/* Drag & Drop Area */}
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center
          p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer">
            {/* Icon */}
            <Icon icon="tabler:upload" className="w-10 h-10 text-gray-400" />
            {/* Text */}
            <p className="mt-4 text-sm text-gray-600 text-center">
              Drag & drop a file here, or{' '}
              <span className="text-blue-500 hover:text-blue-600">
                click to select a file to upload
              </span>
            </p>
            {/* Hidden File Input */}
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Checkboxes */}
          <div className="mt-6 space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Import skills</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                Automatically assign skill levels depending on the years of experience
              </span>
            </label>
          </div>
        </div>

        <div>
          <Language />
        </div>
      </div>
    </div>
  );
};

export default DragDrop;
