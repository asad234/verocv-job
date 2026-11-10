import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface AvailabilityProps {
  onSave: (availability: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const Availability: React.FC<AvailabilityProps> = ({ onSave, onCancel, initialData }) => {
  const [availability, setAvailability] = useState({
    status: initialData?.status || "Available",
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || new Date(),
    isOngoing: initialData?.isOngoing || false,
  });

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto">
      <h3 className="text-md font-semibold text-gray-800 mb-4">
        {initialData ? "Edit Availability" : "Add Availability"}
      </h3>

      <div className="mb-4">
        <label className="block text-gray-600 text-sm mb-1">Availability *</label>
        <select
          value={availability.status}
          onChange={(e) => setAvailability({ ...availability, status: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg"
          required
        >
          <option value="Not Available">Not Available</option>
          <option value="Available">Available</option>
          <option value="Vacation">Vacation</option>
        </select>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-gray-600 text-sm mb-1">Start Date *</label>
          <DatePicker
  selected={availability.startDate}
  onChange={(date: Date | null) => setAvailability({ ...availability, startDate: date })}
  className="w-full border px-3 py-2 rounded-lg"
  dateFormat="MMMM d, yyyy"
  showMonthDropdown
/>
        </div>

        {!availability.isOngoing && (
          <div>
            <label className="block text-gray-600 text-sm mb-1">End Date *</label>
            <DatePicker
  selected={availability.endDate}
  onChange={(date: Date | null) => setAvailability({ ...availability, endDate: date })}
  className="w-full border px-3 py-2 rounded-lg"
  dateFormat="MMMM d, yyyy"
  showMonthDropdown
  showYearDropdown
  dropdownMode="select"
  minDate={availability.startDate}
  required
/>
          </div>
        )}
      </div>

      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="ongoing"
          checked={availability.isOngoing}
          onChange={(e) => setAvailability({ ...availability, isOngoing: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="ongoing">Ongoing (no end date)</label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
        <Button onClick={() => onSave(availability)}>Save</Button>
      </div>
    </div>
  );
};

export default Availability;
