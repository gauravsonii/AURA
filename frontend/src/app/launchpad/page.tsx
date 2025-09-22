"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  useLaunchpad,
  useCreateTokenAndLaunch,
  useContribute,
  useLaunchManagement,
  LaunchFormData,
} from "@/hooks/useLaunchpad";
import { LaunchCard } from "@/components/LaunchCard";
import GlowButton from "@/components/ui/glow-button";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function LaunchpadPage() {
  const [selectedTab, setSelectedTab] = useState("projects");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Animation refs - removed useInView to prevent tab switching jitter

  const { address } = useAccount();
  const { launches, launchCount, loading, error, refetch } = useLaunchpad();
  const {
    createTokenAndLaunch,
    isPending: isCreating,
    isSuccess: isCreateSuccess,
  } = useCreateTokenAndLaunch();
  const { contribute, isPending: isContributing } = useContribute();
  const {
    finalizeLaunch,
    cancelLaunch,
    isPending: isManaging,
  } = useLaunchManagement();

  const [formData, setFormData] = useState<LaunchFormData>({
    name: "",
    symbol: "",
    totalSupply: "",
    pricePerToken: "",
    minContribution: "",
    maxContribution: "",
    duration: "7",
  });

  useEffect(() => {
    if (isCreateSuccess) {
      setShowCreateForm(false);
      setFormData({
        name: "",
        symbol: "",
        totalSupply: "",
        pricePerToken: "",
        minContribution: "",
        maxContribution: "",
        duration: "7",
      });
      // Add a small delay to ensure the transaction is fully processed
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [isCreateSuccess, refetch]);

  const handleFormChange = (field: keyof LaunchFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateLaunch = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate form data
    if (
      !formData.name ||
      !formData.symbol ||
      !formData.totalSupply ||
      !formData.pricePerToken
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTokenAndLaunch(formData);
    } catch (error) {
      console.error("Error creating launch:", error);
      toast.error("Failed to create launch");
    }
  };

  const handleContribute = async (launchId: number, amount: string) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid contribution amount");
      return;
    }

    try {
      await contribute(launchId, amount);
      // Add a small delay to ensure the transaction is fully processed
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error("Error contributing:", error);
      toast.error("Failed to contribute");
    }
  };

  const calculateLaunchFee = () => {
    if (!formData.totalSupply || !formData.pricePerToken) return "0";
    const totalSupply = parseEther(formData.totalSupply);
    const pricePerToken = parseEther(formData.pricePerToken);
    const launchFee = (totalSupply * pricePerToken) / BigInt(10); // 10% fee
    return formatEther(launchFee);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Static 3D Glass Cards Background */}
      <div className="absolute inset-0 z-0" style={{ perspective: "1000px" }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-28 h-36 bg-white/2 backdrop-blur-sm rounded-xl border border-white/5 shadow-xl`}
            style={{
              left: `${10 + i * 15}%`,
              top: `${65 + (i % 2) * 8}%`,
              transform: `translateY(-50%) rotateY(${
                (i - 2.5) * 12
              }deg) rotateX(6deg) scale(0.75)`,
              transformOrigin: "center center",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, filter: "blur(20px)", y: -30 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-5xl font-bold text-white mb-4"
            style={{
              fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
            }}
            initial={{ opacity: 0, filter: "blur(20px)", y: -20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Fair Launchpad
          </motion.h1>
          <motion.p
            className="text-gray-300 text-lg max-w-3xl mx-auto"
            initial={{ opacity: 0, filter: "blur(15px)", y: -15 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Launch your project with confidence. Our AI-powered launchpad
            provides security analysis, automated liquidity bootstrapping, and
            anti-rug pull mechanisms.
          </motion.p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, filter: "blur(15px)", y: -20 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 flex"
            style={{
              boxShadow:
                "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
            }}
          >
            {["projects", "launch", "security"].map((tab, index) => (
              <motion.button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-2 rounded-full transition-all duration-300 capitalize ${
                  selectedTab === tab
                    ? "bg-white/20 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
                initial={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
              >
                {tab}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Projects Tab */}
        {selectedTab === "projects" && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, filter: "blur(20px)", y: 30 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(20px)", y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex justify-between items-center"
              initial={{ opacity: 0, filter: "blur(15px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-2xl font-semibold text-white">
                Active & Upcoming Projects ({launchCount})
              </h2>
              <button onClick={() => setShowCreateForm(true)}>
                <GlowButton
                  variant="red"
                  className=" text-white px-6 py-2 rounded-full transition-all duration-300"
                >
                  Create Launch
                </GlowButton>
              </button>
            </motion.div>

            {loading && (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="text-red-400 mb-4">
                  Error loading launches: {error}
                </div>
                <button
                  onClick={() => refetch()}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-2 rounded-full transition-all duration-300"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && launches.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-300">
                  No launches found. Be the first to launch a project!
                </div>
              </div>
            )}

            {error && launches.length > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-300 text-sm font-medium">
                    Demo Mode
                  </span>
                </div>
                <div className="text-white text-sm">
                  Showing demo data. Contract connection failed: {error}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {launches.map((launch, index) => {
                return (
                  <LaunchCard
                    key={index}
                    launch={launch}
                    launchId={index}
                    onContribute={handleContribute}
                    onFinalize={finalizeLaunch}
                    onCancel={cancelLaunch}
                    isContributing={isContributing}
                    isManaging={isManaging}
                    userAddress={address}
                    isDemoMode={!!error}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Launch Tab */}
        {selectedTab === "launch" && (
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, filter: "blur(20px)", y: 50 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
              initial={{ opacity: 0, filter: "blur(15px)", y: 30 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-8">
                Launch Your Project
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Token Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter token name"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Token Symbol
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TOKEN"
                      value={formData.symbol}
                      onChange={(e) =>
                        handleFormChange("symbol", e.target.value.toUpperCase())
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Total Supply
                    </label>
                    <input
                      type="number"
                      placeholder="Total token supply"
                      value={formData.totalSupply}
                      onChange={(e) =>
                        handleFormChange("totalSupply", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Price per Token (AVAX)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Price in AVAX"
                      value={formData.pricePerToken}
                      onChange={(e) =>
                        handleFormChange("pricePerToken", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Min Contribution (AVAX)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Minimum contribution"
                      value={formData.minContribution}
                      onChange={(e) =>
                        handleFormChange("minContribution", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Max Contribution (AVAX)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Maximum contribution"
                      value={formData.maxContribution}
                      onChange={(e) =>
                        handleFormChange("maxContribution", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">
                      Launch Duration (Days)
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) =>
                        handleFormChange("duration", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-white/30"
                    >
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>

                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-red-300 text-sm font-medium">
                        Launch Fee
                      </span>
                    </div>
                    <div className="text-white text-sm">
                      {calculateLaunchFee()} AVAX (10% of total value)
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateLaunch}
                disabled={isCreating || !address}
                className="w-full mt-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all duration-300"
              >
                {isCreating
                  ? "Creating Launch..."
                  : !address
                  ? "Connect Wallet to Launch"
                  : "Create Token & Launch"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Security Tab */}
        {selectedTab === "security" && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, filter: "blur(20px)", y: 50 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
              initial={{ opacity: 0, filter: "blur(15px)", x: -30 }}
              animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h3 className="text-2xl font-semibold text-white mb-6">
                AI Security Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      Contract Vulnerability Scan
                    </h4>
                    <p className="text-gray-300 text-sm">
                      AI analyzes smart contracts for common vulnerabilities and
                      exploits
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      Liquidity Lock Enforcement
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Automatic liquidity locking prevents rug pulls and ensures
                      market stability
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">
                      Team Verification
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Multi-factor verification of project teams and backgrounds
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
              initial={{ opacity: 0, filter: "blur(15px)", x: 30 }}
              animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h3 className="text-2xl font-semibold text-white mb-6">
                Security Stats
              </h3>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    99.8%
                  </div>
                  <div className="text-gray-300">Security Accuracy Rate</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">0</div>
                  <div className="text-gray-300">Successful Rug Pulls</div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    847
                  </div>
                  <div className="text-gray-300">Projects Analyzed</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Create Launch Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              boxShadow:
                "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Create Token & Launch
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Token Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter token name"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Token Symbol
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TOKEN"
                    value={formData.symbol}
                    onChange={(e) =>
                      handleFormChange("symbol", e.target.value.toUpperCase())
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Total Supply
                  </label>
                  <input
                    type="number"
                    placeholder="Total token supply"
                    value={formData.totalSupply}
                    onChange={(e) =>
                      handleFormChange("totalSupply", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Price per Token (AVAX)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Price in AVAX"
                    value={formData.pricePerToken}
                    onChange={(e) =>
                      handleFormChange("pricePerToken", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Min Contribution (AVAX)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Minimum contribution"
                    value={formData.minContribution}
                    onChange={(e) =>
                      handleFormChange("minContribution", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Max Contribution (AVAX)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Maximum contribution"
                    value={formData.maxContribution}
                    onChange={(e) =>
                      handleFormChange("maxContribution", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">
                  Launch Duration (Days)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleFormChange("duration", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-white/30"
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-300 text-sm font-medium">
                    Launch Fee
                  </span>
                </div>
                <div className="text-white text-sm">
                  {calculateLaunchFee()} AVAX (10% of total value)
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <GlowButton
                  variant="red"
                  onClick={handleCreateLaunch}
                  disabled={isCreating || !address}
                  className="flex-1 justify-center items-center disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-300"
                >
                  {isCreating
                    ? "Creating..."
                    : !address
                    ? "Connect Wallet"
                    : "Create & Launch"}
                </GlowButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
