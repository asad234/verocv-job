import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CommitmentsFormProps {
  onSave: (commitment: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const CommitmentsForm: React.FC<CommitmentsFormProps> = ({ onSave, onCancel, initialData }) => {
  const [commitmentForm, setCommitmentForm] = useState({
    title: initialData?.title || "",
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    isOngoing: initialData?.isOngoing || false,
    description: initialData?.description || "",
    link: initialData?.link || "",
  });

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        {initialData ? "Edit Commitment/Publication" : "Add Commitment/Publication"}
      </h3>

      <label className="text-gray-600 text-sm">Title *</label>
      <input
        type="text"
        value={commitmentForm.title}
        onChange={(e) => setCommitmentForm({ ...commitmentForm, title: e.target.value })}
        className="w-full border px-3 py-2 rounded-lg mt-1"
        placeholder="Enter title"
        required
      />

      <div className="flex gap-4 mt-3">
        <div className="w-1/2">
          <label className="text-gray-600 text-sm">Start Date</label>
          <DatePicker
            selected={commitmentForm.startDate}
            onChange={(date: Date | null) => {
              setCommitmentForm({ ...commitmentForm, startDate: date || new Date() });
            }}
            className="border px-2 py-2 rounded-lg w-full"
            dateFormat="MMMM yyyy"
            showMonthYearPicker
          />
        </div>
        {!commitmentForm.isOngoing && (
          <div className="w-1/2">
            <label className="text-gray-600 text-sm">End Date</label>
            <DatePicker
              selected={commitmentForm.endDate}
              onChange={(date: Date | null) => {
                setCommitmentForm({ ...commitmentForm, endDate: date || new Date() });
              }}
              className="border px-2 py-2 rounded-lg w-full"
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              minDate={commitmentForm.startDate}
            />
          </div>
        )}
      </div>

      <div className="flex items-center mt-3">
        <input
          type="checkbox"
          checked={commitmentForm.isOngoing}
          onChange={(e) => setCommitmentForm({ ...commitmentForm, isOngoing: e.target.checked })}
        />
        <label className="ml-2">Ongoing</label>
      </div>

      <label className="text-gray-600 text-sm mt-4">Description *</label>
      <textarea
        value={commitmentForm.description}
        onChange={(e) => setCommitmentForm({ ...commitmentForm, description: e.target.value })}
        className="w-full border px-3 py-2 rounded-lg h-20 mt-1"
        placeholder="Enter details about your commitment or publication"
        required
      ></textarea>

      <label className="text-gray-600 text-sm mt-4">Link</label>
      <input
        type="text"
        value={commitmentForm.link}
        onChange={(e) => setCommitmentForm({ ...commitmentForm, link: e.target.value })}
        className="w-full border px-3 py-2 rounded-lg mt-1"
        placeholder="Enter URL if applicable"
      />

      <div className="flex justify-start gap-4 mt-4">
        <Button onClick={() => onSave(commitmentForm)}>Save</Button>
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

export default CommitmentsForm;
