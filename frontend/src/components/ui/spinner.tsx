import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "white" | "red" | "gray";
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className = "",
  color = "white",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClasses = {
    white: "border-white border-t-transparent",
    red: "border-red-500 border-t-transparent",
    gray: "border-gray-300 border-t-transparent",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-2 
        rounded-full 
        animate-spin
        ${className}
      `}
      aria-label="Loading"
    />
  );
};

export default Spinner;
