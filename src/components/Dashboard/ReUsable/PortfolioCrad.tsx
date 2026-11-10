import React from "react";
import { Icon } from "@iconify/react";
import Button from "./Button";

interface PortfolioCardProps {
  buttonText?: string;
  onClick?: () => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  buttonText = "Create a portfolio",
  onClick
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="relative w-44 h-24 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
          <div className="text-gray-300">Nothing here yet</div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm">
            <Icon icon="tabler:plus" className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        <p className="text-gray-600 mt-2 flex items-center">
          Nothing here yet <span className="ml-1 text-orange-500">👋</span>
        </p>

        <div className="mt-6">
          <Button
            onClick={onClick}
            className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
