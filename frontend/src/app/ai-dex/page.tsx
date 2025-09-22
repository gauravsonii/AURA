"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { InteractiveChart } from "../../components/InteractiveChart";
import AIFeeRecommendation from "@/components/AIFeeRecommendation";
import AIMarketInsights from "@/components/AIMarketInsights";
import Tooltip from "@/components/ui/tooltip";

import GlowButton from "@/components/ui/glow-button";

export default function AIDexPage() {
  const [selectedTab, setSelectedTab] = useState("trade");

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Enhanced Animated Background */}

      {/* Static 3D Glass Cards Background */}
      <div className="absolute inset-0 z-10" style={{ perspective: "1000px" }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-32 h-40 bg-white/2 backdrop-blur-sm rounded-xl border border-white/5 shadow-xl`}
            style={{
              left: `${15 + i * 20}%`,
              top: `${60 + (i % 2) * 10}%`,
              transform: `translateY(-50%) rotateY(${
                (i - 2) * 15
              }deg) rotateX(8deg) scale(0.8)`,
              transformOrigin: "center center",
            }}
            animate={{
              rotateY: [(i - 2) * 15, (i - 2) * 15 + 5, (i - 2) * 15],
              scale: [0.8, 0.85, 0.8],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-20 max-w-7xl mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.h1
            className="text-5xl font-bold text-white mb-4"
            style={{
              fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            AI-Governed DEX
          </motion.h1>
          <motion.p
            className="text-gray-300 text-lg max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Experience the future of decentralized trading with our AI-powered
            exchange that optimizes fees in real-time based on market
            conditions.
          </motion.p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 flex">
            {["trade", "analytics", "fees"].map((tab, index) => (
              <motion.button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-2 rounded-full transition-all duration-300 capitalize relative ${
                  selectedTab === tab
                    ? "text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
              >
                {selectedTab === tab && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Trading Interface */}
          {selectedTab === "trade" && (
            <motion.div
              key="trade"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Swap Card */}
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
                  style={{
                    boxShadow:
                      "inset 4px 4px 16px rgba(239, 68, 68, 0.1), inset -4px -4px 16px rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <h3 className="text-2xl font-semibold text-white mb-6">
                    Swap Tokens
                  </h3>
                  {/* From Token */}
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <label className="text-gray-300 text-sm mb-2 block">
                      From
                    </label>
                    <motion.div
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition-all duration-300"
                      style={{
                        boxShadow:
                          "inset 2px 2px 8px rgba(239, 68, 68, 0.08), inset -2px -2px 8px rgba(239, 68, 68, 0.08)",
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-8 h-8 rounded-full overflow-hidden"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Image
                            src="/avax.png"
                            alt="AVAX"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <span className="text-white font-medium">AVAX</span>
                      </div>
                      <motion.input
                        type="number"
                        placeholder="0.0"
                        className="bg-transparent text-white text-xl text-right outline-none"
                        whileFocus={{ scale: 1.02 }}
                      />
                    </motion.div>
                  </motion.div>{" "}
                  {/* Swap Arrow */}
                  {/* Swap Arrow */}
                  <motion.div
                    className="flex justify-center my-4"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <motion.button
                      className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 transition-all duration-300"
                      style={{
                        boxShadow:
                          "inset 2px 2px 8px rgba(239, 68, 68, 0.1), inset -2px -2px 8px rgba(239, 68, 68, 0.1)",
                      }}
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    </motion.button>
                  </motion.div>
                  {/* To Token */}
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <label className="text-gray-300 text-sm mb-2 block">
                      To
                    </label>
                    <motion.div
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition-all duration-300"
                      style={{
                        boxShadow:
                          "inset 2px 2px 8px rgba(239, 68, 68, 0.08), inset -2px -2px 8px rgba(239, 68, 68, 0.08)",
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-8 h-8  rounded-full"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        />
                        <span className="text-white font-medium">AURA</span>
                      </div>
                      <motion.input
                        type="number"
                        placeholder="0.0"
                        className="bg-transparent text-white text-xl text-right outline-none"
                        whileFocus={{ scale: 1.02 }}
                      />
                    </motion.div>
                  </motion.div>
                  {/* AI Fee Display */}
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <AIFeeRecommendation showDetails={false} />
                  </motion.div>
                  {/* Enhanced Swap Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <GlowButton
                        variant="red"
                        className="w-full py-4 px-6 text-lg flex flex-col font-semibold"
                      >
                        <motion.div
                          className="flex items-center justify-center gap-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.3 }}
                        >
                          <motion.svg
                            className="w-5 h-5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            animate={{ rotate: [0, 180, 360] }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </motion.svg>
                          <span className="text-white">Swap Tokens</span>
                        </motion.div>
                      </GlowButton>
                    </motion.div>

                    {/* Particle effects on hover */}
                    <motion.div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full opacity-0"
                          style={{
                            left: `${20 + i * 10}%`,
                            top: `${40 + Math.random() * 20}%`,
                          }}
                          whileHover={{
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                            y: [0, -20, -40],
                          }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.1,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Market Stats */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {/* Assets Balance Card */}
                <motion.div
                  className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 overflow-hidden group"
                  style={{
                    boxShadow:
                      "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {/* Gradient overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-600/5 group-hover:from-red-500/10 group-hover:to-red-600/10 transition-all duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-300 text-sm font-medium">
                        Assets Balance
                      </h3>
                      <div className="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      </div>
                    </div>
                    <motion.div
                      className="text-4xl font-bold text-white mb-4"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      $19,600
                    </motion.div>
                    <div className="flex gap-3">
                      <Tooltip text="Coming Soon" position="top">
                        <motion.button
                          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden group"
                          whileHover={{
                            scale: 1.05,
                            boxShadow: "0 8px 25px rgba(255, 255, 255, 0.1)",
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Button shimmer effect */}
                          <motion.div
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                            whileHover={{ translateX: "200%" }}
                            transition={{ duration: 0.6 }}
                          />
                          <span className="relative z-10">Stake</span>
                        </motion.button>
                      </Tooltip>
                      <Tooltip text="Coming Soon" position="top">
                        <motion.button
                          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-sm font-medium border border-white/20 transition-all duration-300 relative overflow-hidden group"
                          whileHover={{
                            scale: 1.05,
                            borderColor: "rgba(255, 255, 255, 0.4)",
                            boxShadow: "0 8px 25px rgba(255, 255, 255, 0.1)",
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Button glow effect */}
                          <motion.div
                            className="absolute inset-0 bg-white/5 opacity-0"
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <span className="relative z-10">Unstake</span>
                        </motion.button>
                      </Tooltip>
                    </div>
                  </div>
                </motion.div>

                {/* Pool Balance Card */}
                <motion.div
                  className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 overflow-hidden group"
                  style={{
                    boxShadow:
                      "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  {/* Gradient overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-600/5 group-hover:from-red-500/10 group-hover:to-red-600/10 transition-all duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-300 text-sm font-medium">
                        Pool Balance
                      </h3>
                      <div className="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      </div>
                    </div>
                    <motion.div
                      className="text-4xl font-bold text-white mb-4"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                    >
                      $1,900
                    </motion.div>
                    <Tooltip text="Coming Soon" position="top">
                      <motion.button
                        className="px-6 py-2 bg-transparent hover:bg-white/10 text-white rounded-full text-sm font-medium border border-white/30 hover:border-white/50 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Create Pool
                      </motion.button>
                    </Tooltip>
                  </div>
                </motion.div>

                {/* Claimable Card */}
                <motion.div
                  className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 overflow-hidden group"
                  style={{
                    boxShadow:
                      "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  {/* Gradient overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-600/5 group-hover:from-red-500/10 group-hover:to-red-600/10 transition-all duration-500" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-300 text-sm font-medium">
                        Claimable
                      </h3>
                      <div className="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      </div>
                    </div>
                    <motion.div
                      className="text-4xl font-bold text-white mb-4"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                    >
                      $1,900
                    </motion.div>
                    <Tooltip text="Coming Soon" position="top">
                      <motion.button
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium border border-white/20 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Claim All
                      </motion.button>
                    </Tooltip>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {selectedTab === "analytics" && (
            <motion.div
              key="analytics"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InteractiveChart />
              <AIMarketInsights />
            </motion.div>
          )}

          {/* Fees Tab */}
          {selectedTab === "fees" && (
            <motion.div
              key="fees"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Dynamic Fee Structure */}
              <motion.div
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <motion.h3
                  className="text-2xl font-semibold text-white mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  Dynamic Fee Structure
                </motion.h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      rate: "0.05%",
                      label: "Low Volatility",
                      color: "text-green-400",
                      delay: 0.1,
                    },
                    {
                      rate: "0.15%",
                      label: "Current Rate",
                      color: "text-yellow-400",
                      delay: 0.2,
                    },
                    {
                      rate: "0.30%",
                      label: "High Volatility",
                      color: "text-red-400",
                      delay: 0.3,
                    },
                  ].map((fee, index) => (
                    <motion.div
                      key={fee.label}
                      className="text-center"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + fee.delay, duration: 0.4 }}
                      whileHover={{ scale: 1.1, y: -5 }}
                    >
                      <motion.div
                        className={`text-3xl font-bold ${fee.color} mb-2`}
                        animate={{ scale: index === 1 ? [1, 1.05, 1] : 1 }}
                        transition={{
                          duration: 2,
                          repeat: index === 1 ? Infinity : 0,
                        }}
                      >
                        {fee.rate}
                      </motion.div>
                      <div className="text-gray-300">{fee.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* AI Fee Recommendation */}
              <motion.div
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <motion.h3
                  className="text-2xl font-semibold text-white mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  AI Fee Recommendation
                </motion.h3>
                <AIFeeRecommendation showDetails={true} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
