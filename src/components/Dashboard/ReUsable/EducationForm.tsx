import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS

interface EducationFormProps {
  onSave: (education: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const EducationForm: React.FC<EducationFormProps> = ({ onSave, onCancel, initialData }) => {
  const [educationForm, setEducationForm] = useState({
    school: initialData?.school || "",
    program: initialData?.program || "",
    level: initialData?.level || "",
    place: initialData?.place || "",
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    isOngoing: initialData?.isOngoing || false,
    description: initialData?.description || "",
    link: initialData?.link || "",
  });

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        {initialData ? "Edit Education" : "Add Education"}
      </h3>

      {/* School and Program */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-gray-600 text-sm">School *</label>
          <input
            type="text"
            value={educationForm.school}
            onChange={(e) => setEducationForm({ ...educationForm, school: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter school"
            required
          />
        </div>
        <div>
          <label className="text-gray-600 text-sm">Program *</label>
          <input
            type="text"
            value={educationForm.program}
            onChange={(e) => setEducationForm({ ...educationForm, program: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter program"
            required
          />
        </div>
      </div>

      {/* Level and Place */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-gray-600 text-sm">Level *</label>
          <input
            type="text"
            value={educationForm.level}
            onChange={(e) => setEducationForm({ ...educationForm, level: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter level (e.g., Bachelor's)"
            required
          />
        </div>
        <div>
          <label className="text-gray-600 text-sm">Place *</label>
          <input
            type="text"
            value={educationForm.place}
            onChange={(e) => setEducationForm({ ...educationForm, place: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter place (e.g., Stockholm)"
            required
          />
        </div>
      </div>

      {/* Start Date and End Date */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-gray-600 text-sm">Start Date *</label>
          <DatePicker
            selected={educationForm.startDate}
            onChange={(date: Date | null) => {
              setEducationForm({ ...educationForm, startDate: date || new Date() });
            }}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            required
          />
        </div>
        {!educationForm.isOngoing && (
          <div>
            <label className="text-gray-600 text-sm">End Date *</label>
            <DatePicker
              selected={educationForm.endDate}
              onChange={(date: Date | null) => {
                setEducationForm({ ...educationForm, endDate: date || new Date() });
              }}
              className="w-full border px-3 py-2 rounded-lg mt-1"
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              required
            />
          </div>
        )}
      </div>

      {/* Ongoing Checkbox */}
      <div className="flex items-center mt-4">
        <input
          type="checkbox"
          checked={educationForm.isOngoing}
          onChange={(e) => setEducationForm({ ...educationForm, isOngoing: e.target.checked })}
        />
        <label className="ml-2">Ongoing</label>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Description *</label>
        <textarea
          value={educationForm.description}
          onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter education details"
          required
        />
      </div>

      {/* Link */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Link</label>
        <input
          type="text"
          value={educationForm.link}
          onChange={(e) => setEducationForm({ ...educationForm, link: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter link (optional)"
        />
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-start gap-4 mt-4">
        <Button onClick={() => onSave(educationForm)}>Save</Button>
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

export default EducationForm;