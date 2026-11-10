import React from "react";
import { Icon } from "@iconify/react";
import { Route } from "next";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void> | Promise<boolean>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: string;
  iconPosition?: "left" | "right";
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  variant = "primary",
  icon,
  iconPosition = "left",
}) => {
  // Base classes
  const baseClasses = "px-6 py-2 text-sm rounded-full transition-colors duration-200 flex items-center justify-center gap-2";

  // Variant classes
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    ghost: "bg-transparent text-blue-500 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  };

  // Disabled state
  const disabledClasses = "opacity-50 cursor-not-allowed";

  // Loading state
  const loadingContent = (
    <>
      <Icon icon="tabler:loader-2" className="w-5 h-5 animate-spin" />
      <span>Processing...</span>
    </>
  );

  // Normal content
  const normalContent = (
    <>
      {icon && iconPosition === "left" && <Icon icon={icon} className="w-5 h-5" />}
      {children}
      {icon && iconPosition === "right" && <Icon icon={icon} className="w-5 h-5" />}
    </>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${disabled || loading ? disabledClasses : ''}
        ${className}
      `}
    >
      {loading ? loadingContent : normalContent}
    </button>
  );
};

export default Button;