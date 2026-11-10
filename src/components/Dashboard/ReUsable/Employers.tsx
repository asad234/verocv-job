import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS

interface EmployerFormProps {
  onSave: (employer: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const EmployerForm: React.FC<EmployerFormProps> = ({ onSave, onCancel, initialData }) => {
  const [employerForm, setEmployerForm] = useState({
    employer: initialData?.employer || "",
    title: initialData?.title || "",
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    isOngoing: initialData?.isOngoing || false,
    description: initialData?.description || "",
    link: initialData?.link || "",
    achievements: initialData?.achievements || "",
  });

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        {initialData ? "Edit Employer" : "Add Employer"}
      </h3>

      {/* Employer and Title */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-gray-600 text-sm">Employer *</label>
          <input
            type="text"
            value={employerForm.employer}
            onChange={(e) => setEmployerForm({ ...employerForm, employer: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter employer"
            required
          />
        </div>
        <div>
          <label className="text-gray-600 text-sm">Title *</label>
          <input
            type="text"
            value={employerForm.title}
            onChange={(e) => setEmployerForm({ ...employerForm, title: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter title"
            required
          />
        </div>
      </div>

      {/* Start Date, End Date, and Ongoing Checkbox */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-gray-600 text-sm">Start Date *</label>
            <DatePicker
              selected={employerForm.startDate}
              onChange={(date: Date | null) => {
                setEmployerForm({ ...employerForm, startDate: date || new Date() });
              }}
              className="w-full border px-3 py-2 rounded-lg mt-1"
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              required
            />
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={employerForm.isOngoing}
              onChange={(e) => setEmployerForm({ ...employerForm, isOngoing: e.target.checked })}
            />
            <label className="ml-2">Ongoing</label>
          </div>
        </div>
        {!employerForm.isOngoing && (
          <div>
            <label className="text-gray-600 text-sm">End Date *</label>
            <DatePicker
              selected={employerForm.endDate}
              onChange={(date: Date | null) => {
                setEmployerForm({ ...employerForm, endDate: date || new Date() });
              }}
              className="w-full border px-3 py-2 rounded-lg mt-1"
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              required
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Description *</label>
        <textarea
          value={employerForm.description}
          onChange={(e) => setEmployerForm({ ...employerForm, description: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter job description"
          required
        />
      </div>

      {/* Achievements */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Achievements</label>
        <textarea
          value={employerForm.achievements}
          onChange={(e) => setEmployerForm({ ...employerForm, achievements: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter achievements during this job"
        />
      </div>

      {/* Link */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Link</label>
        <input
          type="text"
          value={employerForm.link}
          onChange={(e) => setEmployerForm({ ...employerForm, link: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter link (optional)"
        />
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-start gap-4 mt-4">
        <Button onClick={() => onSave(employerForm)}>Save</Button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EmployerForm;