import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string,
  hoverEffect?: boolean;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  padding?: "sm" | "md" | "lg";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  onClick,
  variant = "default",
  padding = "md",
  id = ""
}) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const variantClasses = {
    default: "bg-white border border-gray-200 shadow-sm",
    outline: "border border-gray-200",
    ghost: "border border-transparent",
  };

  return (
    <div
      className={`
        rounded-xl
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverEffect ? "transition-all hover:shadow-md hover:border-gray-300" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;