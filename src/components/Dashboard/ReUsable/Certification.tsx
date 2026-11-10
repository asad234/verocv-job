import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS

interface CertificationCourseFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const CertificationCourseForm: React.FC<CertificationCourseFormProps> = ({ onSave, onCancel, initialData }) => {
  const [type, setType] = useState<"Course" | "Certification">(initialData?.type || "Course");
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    startDate: initialData?.startDate || new Date(),
    validDate: initialData?.validDate || new Date(),
    code: initialData?.code || "",
    issuer: initialData?.issuer || "",
    supplier: initialData?.supplier || "",
    description: initialData?.description || "",
    link: initialData?.link || "",
  });

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        {initialData ? `Edit ${type}` : `Add ${type}`}
      </h3>

      {/* Switch Button for Course/Certification */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setType("Course")}
          className={`px-4 py-2 rounded-lg ${type === "Course" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
        >
          Course
        </button>
        <button
          onClick={() => setType("Certification")}
          className={`px-4 py-2 rounded-lg ${type === "Certification" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
        >
          Certification
        </button>
      </div>

      {/* Title with Search Icon */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-gray-600 text-sm">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="Enter title"
            required
          />
        </div>
        <button className="mt-6">
          <Icon icon="tabler:search" className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Start Date, Valid Date, and Code (Grid Layout) */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div>
          <label className="text-gray-600 text-sm">Start Date *</label>
          <DatePicker
            selected={formData.startDate}
            onChange={(date: Date | null) => {
              setFormData({ ...formData, startDate: date || new Date() });
            }}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            required
          />
        </div>
        <div>
          <label className="text-gray-600 text-sm">Valid Date *</label>
          <DatePicker
            selected={formData.validDate}
            onChange={(date: Date | null) => {
              setFormData({ ...formData, validDate: date || new Date() });
            }}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            required
          />
        </div>
        <div>
          <label className="text-gray-600 text-sm">Code *</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg mt-1"
              placeholder="Enter code"
              required
            />
            <button className="mt-1">
              <Icon icon="tabler:search" className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Issuer and Supplier with Search Icons */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-gray-600 text-sm">Issuer *</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg mt-1"
              placeholder="Enter issuer"
              required
            />
            <button className="mt-1">
              <Icon icon="tabler:search" className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
        <div>
          <label className="text-gray-600 text-sm">Supplier *</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full border px-3 py-2 rounded-lg mt-1"
              placeholder="Enter supplier"
              required
            />
            <button className="mt-1">
              <Icon icon="tabler:search" className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter description"
          required
        />
      </div>

      {/* Link */}
      <div className="mt-4">
        <label className="text-gray-600 text-sm">Link</label>
        <input
          type="text"
          value={formData.link}
          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          className="w-full border px-3 py-2 rounded-lg mt-1"
          placeholder="Enter link (optional)"
        />
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-start gap-4 mt-4">
        <Button onClick={() => onSave({ ...formData, type })}>Save</Button>
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

export default CertificationCourseForm;
