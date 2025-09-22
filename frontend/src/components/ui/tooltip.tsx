"use client";

import { useState } from "react";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  children,
  text,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45";
      case "bottom":
        return "absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45";
      case "left":
        return "absolute left-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-900 border-t border-r border-gray-700 rotate-45";
      case "right":
        return "absolute right-full top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-900 border-b border-l border-gray-700 rotate-45";
      default:
        return "absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45";
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${getPositionClasses()} px-3 py-2 bg-stone-900 text-white text-sm rounded-lg shadow-lg border border-gray-700 whitespace-nowrap z-50 pointer-events-none`}
        >
          {text}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
}
