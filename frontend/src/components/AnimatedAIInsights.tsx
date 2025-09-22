"use client";

import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface AIInsight {
  id: string;
  icon: React.ElementType;
  text: string;
  type: "positive" | "warning" | "neutral" | "active";
  confidence: number;
  trend?: "up" | "down" | "stable";
}

const insights: AIInsight[] = [
  {
    id: "1",
    icon: TrendingUp,
    text: "Optimal trading conditions detected",
    type: "positive",
    confidence: 94,
    trend: "up",
  },
  {
    id: "2",
    icon: Activity,
    text: "Moderate volatility expected",
    type: "warning",
    confidence: 78,
    trend: "stable",
  },
  {
    id: "3",
    icon: Zap,
    text: "Fee optimization active",
    type: "active",
    confidence: 99,
    trend: "up",
  },
  {
    id: "4",
    icon: TrendingDown,
    text: "Liquidity increasing rapidly",
    type: "positive",
    confidence: 87,
    trend: "up",
  },
];

export function AnimatedAIInsights() {
  const [currentInsights, setCurrentInsights] = useState(insights.slice(0, 3));
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setTimeout(() => {
        const shuffled = [...insights].sort(() => 0.5 - Math.random());
        setCurrentInsights(shuffled.slice(0, 3));
        setIsUpdating(false);
      }, 500);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getColorScheme = (type: string) => {
    switch (type) {
      case "positive":
        return {
          text: "text-emerald-400",
          bg: "bg-emerald-500/20",
          border: "border-emerald-400/30",
          icon: "text-emerald-300",
        };
      case "warning":
        return {
          text: "text-yellow-400",
          bg: "bg-yellow-500/20",
          border: "border-yellow-400/30",
          icon: "text-yellow-300",
        };
      case "active":
        return {
          text: "text-blue-400",
          bg: "bg-blue-500/20",
          border: "border-blue-400/30",
          icon: "text-blue-300",
        };
      default:
        return {
          text: "text-gray-400",
          bg: "bg-gray-500/20",
          border: "border-gray-400/30",
          icon: "text-gray-300",
        };
    }
  };

  return (
    <motion.div
      className="relative bg-gradient-to-br from-slate-900/50 via-black/40 to-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 overflow-hidden group"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      {/* Neural network background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <defs>
            <pattern
              id="neural"
              patternUnits="userSpaceOnUse"
              width="40"
              height="40"
            >
              <circle
                cx="20"
                cy="20"
                r="1"
                fill="currentColor"
                className="text-blue-400"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.8;0.2"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx="5"
                cy="5"
                r="0.5"
                fill="currentColor"
                className="text-emerald-400"
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.6;0.1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h3 className="text-xl font-semibold text-white">AI Insights</h3>
          </div>

          {/* AI Status Indicator */}
          <motion.div
            className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full"
            animate={{ opacity: isUpdating ? 0.5 : 1 }}
          >
            <motion.div
              className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-emerald-300 text-xs font-medium">
              {isUpdating ? "Analyzing..." : "Active"}
            </span>
          </motion.div>
        </div>

        <div className="space-y-4">
          {currentInsights.map((insight, index) => {
            const colors = getColorScheme(insight.type);
            const IconComponent = insight.icon;

            return (
              <motion.div
                key={`${insight.id}-${index}`}
                className={`flex items-center gap-3 p-3 ${colors.bg} ${colors.border} border rounded-xl`}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <motion.div
                  className={`p-2 rounded-lg bg-black/20`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <IconComponent className={`w-4 h-4 ${colors.icon}`} />
                </motion.div>

                <div className="flex-1">
                  <motion.div
                    className={`${colors.text} text-sm font-medium`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                  >
                    {insight.text}
                  </motion.div>

                  {/* Confidence indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-black/30 rounded-full h-1 overflow-hidden">
                      <motion.div
                        className={`h-full ${colors.bg.replace("/20", "/60")}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence}%` }}
                        transition={{ delay: index * 0.1 + 0.4, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs">
                      {insight.confidence}%
                    </span>
                  </div>
                </div>

                {/* Trend indicator */}
                {insight.trend && (
                  <motion.div
                    className={`p-1 rounded ${
                      insight.trend === "up"
                        ? "text-emerald-400"
                        : insight.trend === "down"
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                    animate={{
                      y:
                        insight.trend === "up"
                          ? [-2, 0]
                          : insight.trend === "down"
                          ? [0, 2]
                          : 0,
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    {insight.trend === "up" && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {insight.trend === "down" && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {insight.trend === "stable" && (
                      <Activity className="w-3 h-3" />
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Update timestamp */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          {/* <span className="text-gray-500 text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </span> */}
        </motion.div>
      </div>
    </motion.div>
  );
}
