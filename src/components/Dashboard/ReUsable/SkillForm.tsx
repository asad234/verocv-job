import React, { useState, useEffect } from "react";
import Button from "../ReUsable/Button";

interface Skill {
  skillName: string;
  skillRating: number; // Rating from 1 to 5
}

interface SkillFormProps {
  onSave: (skill: Skill) => void;
  onCancel: () => void;
  initialData?: Skill | null;
  isEditing?: boolean;
}

const SkillForm: React.FC<SkillFormProps> = ({
  onSave,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [name, setName] = useState(initialData?.skillName || "");
  const [rating, setRating] = useState(initialData?.skillRating || 1);
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.skillName);
      setRating(initialData.skillRating);
    } else {
      setName("");
      setRating(1);
    }
    setIsDirty(false);
  }, [initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setIsDirty(true);
  };

  const handleRatingChange = (value: number) => {
    setRating(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      // Optional: Add visual feedback for empty name
      return;
    }
    onSave({
      skillName: name.trim(),
      skillRating: rating
    });

    // Only reset if not in editing mode
    if (!isEditing) {
      setName("");
      setRating(1);
    }
  };

  const ratingColors = [
    "bg-red-500",    // 1
    "bg-orange-400", // 2
    "bg-yellow-400", // 3
    "bg-lime-400",   // 4
    "bg-green-500"   // 5
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <div>
        <label htmlFor="skill-name" className="block text-sm font-medium text-gray-700 mb-1">
          Skill Name *
        </label>
        <input
          id="skill-name"
          type="text"
          placeholder="e.g. JavaScript, React"
          value={name}
          onChange={handleNameChange}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-required="true"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">Rating *</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRatingChange(value)}
              className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors ${rating === value
                  ? `${ratingColors[value - 1]} text-white`
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              aria-label={`Rate ${value} out of 5`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          onClick={onCancel}
          className="min-w-[80px]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || (!isDirty && isEditing)}
          className="min-w-[80px]"
        >
          {isEditing ? "Update" : "Add"} Skill
        </Button>
      </div>
    </div>
  );
};

export default SkillForm;