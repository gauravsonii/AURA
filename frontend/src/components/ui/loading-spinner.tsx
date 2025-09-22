import React from "react";
import Spinner from "./spinner";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "white" | "red" | "gray";
  showText?: boolean;
  center?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
  size = "md",
  className = "",
  color = "white",
  showText = false,
  center = true,
}) => {
  const containerClasses = center
    ? "flex items-center justify-center gap-3"
    : "flex items-center gap-3";

  return (
    <div className={`${containerClasses} ${className}`}>
      <Spinner size={size} color={color} />
      {showText && (
        <span
          className={`
          ${size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"}
          ${
            color === "white"
              ? "text-gray-300"
              : color === "red"
              ? "text-red-400"
              : "text-gray-500"
          }
        `}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
