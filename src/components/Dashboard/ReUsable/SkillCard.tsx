import React from "react";
import Card from "./Card";
import Button from "./Button";
import { Icon } from "@iconify/react";

interface SkillCardProps {
  title: string;
  icon: string;
}

const SkillCard: React.FC<SkillCardProps> = ({ title, icon }) => {
  return (
    <Card>
      {/* Dynamic Title with Icon */}
      <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
        <Icon icon={icon} className="w-6 h-6 text-blue-600" />
        <h2>{title}</h2>
      </div>

      <div className="flex flex-col items-center justify-center mt-4">
        <div className="relative flex items-center gap-2 p-2 bg-gray-100 rounded-md w-full sm:w-48 h-14 sm:h-16">
          <div className="w-16 sm:w-20 h-6 bg-gray-300 rounded-md"></div>
          <div className="w-16 sm:w-20 h-6 bg-gray-300 rounded-md"></div>
          {/* Circular Plus Icon */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm">
            <Icon icon="tabler:plus" className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-2 text-center">
          You have not added anything yet. Start by adding the first one now.
        </p>
        <Button className="m-2">Add</Button>
      </div>
    </Card>
  );
};

export default SkillCard;
