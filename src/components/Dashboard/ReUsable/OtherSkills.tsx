import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";

interface OtherSkillsProps {
  onSave: (skills: string[]) => void;
  onCancel: () => void;
  initialData?: string[];
}

const OtherSkills: React.FC<OtherSkillsProps> = ({ onSave, onCancel, initialData }) => {
  const [skills, setSkills] = useState<string[]>(initialData || []);
  const [currentSkill, setCurrentSkill] = useState("");

  const handleSkillInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentSkill.trim() !== "") {
      setSkills((prev) => [...prev, currentSkill.trim()]);
      setCurrentSkill(""); // Clear the input after adding a skill
    }
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-md font-semibold text-gray-800 mb-2">Other Skills</h3>

      <label className="text-gray-600 text-sm">Add Skills</label>
      <div className="flex flex-wrap gap-2 border px-3 py-2 rounded-lg mt-1">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="text-blue-800 hover:text-blue-900"
            >
              <Icon icon="tabler:x" className="w-4 h-4" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={currentSkill}
          onChange={(e) => setCurrentSkill(e.target.value)}
          onKeyDown={handleSkillInput}
          className="flex-1 outline-none"
          placeholder="Type a skill and press Enter"
        />
      </div>

      <div className="flex justify-start gap-4 mt-4">
        <Button onClick={() => onSave(skills)}>Save</Button>
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

export default OtherSkills;
