"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  useMagicLinkEscrow,
  useCreateEscrow,
  useClaimEscrow,
  useCancelEscrow,
  useExpireEscrow,
  useEscrowDetails,
  useEscrowValidation,
  type EscrowDetails,
  type CreateEscrowParams,
  type ClaimEscrowParams,
  type CancelEscrowParams,
} from "@/hooks/useMagicLinkEscrow";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import GlowButton from "./ui/glow-button";
import LoadingSpinner from "./ui/loading-spinner";

// Tooltip component
const Tooltip = ({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg border border-gray-700 whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Token options for the escrow
const TOKEN_OPTIONS = [
  {
    symbol: "AVAX",
    address: "0x0000000000000000000000000000000000000000",
    color: "bg-red-500",
    image: "/avax.png",
  },
  {
    symbol: "TEST",
    address: CONTRACT_ADDRESSES.TestTokens,
    color: "bg-blue-500",
  },
  {
    symbol: "AGOV",
    address: CONTRACT_ADDRESSES.AuraGovernanceToken,
    color: "bg-purple-500",
  },
];

// Simple EscrowPreview component
function EscrowPreview({ escrowId }: { escrowId: number }) {
  const { escrowDetails, isLoading, error } = useEscrowDetails(escrowId);

  const getTokenSymbol = (tokenAddress: string) => {
    const token = TOKEN_OPTIONS.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token ? token.symbol : "Unknown";
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !escrowDetails) {
    return (
      <div className="text-red-300 text-sm">Failed to load escrow details</div>
    );
  }

  const isExpired = Date.now() / 1000 > Number(escrowDetails.expirationTime);
  const status = escrowDetails.claimed
    ? "Claimed"
    : escrowDetails.cancelled
    ? "Cancelled"
    : isExpired
    ? "Expired"
    : "Active";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Amount:</span>
        <span className="text-white">
          {formatEther(escrowDetails.amount)}{" "}
          {getTokenSymbol(escrowDetails.token)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Status:</span>
        <span
          className={`${
            status === "Active"
              ? "text-green-400"
              : status === "Claimed"
              ? "text-blue-400"
              : "text-red-400"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Expires:</span>
        <span className="text-white">
          {new Date(
            Number(escrowDetails.expirationTime) * 1000
          ).toLocaleDateString()}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Sender:</span>
        <span className="text-white font-mono text-xs">
          {escrowDetails.sender.slice(0, 6)}...{escrowDetails.sender.slice(-4)}
        </span>
      </div>
    </div>
  );
}

// Expiration time options
const EXPIRATION_OPTIONS = [
  { label: "1 Hour", value: 3600 },
  { label: "24 Hours", value: 86400 },
  { label: "7 Days", value: 604800 },
  { label: "30 Days", value: 2592000 },
];

// EscrowCard component for displaying individual escrows
interface EscrowCardProps {
  escrow: EscrowDetails;
  escrowId: number;
  onClaim: (params: ClaimEscrowParams) => void;
  onCancel: (params: CancelEscrowParams) => void;
  onExpire: (escrowId: number) => void;
  isClaiming: boolean;
  isCancelling: boolean;
  isExpiring: boolean;
  userAddress?: string;
  isDemoMode?: boolean;
}

function EscrowCard({
  escrow,
  escrowId,
  onClaim,
  onCancel,
  onExpire,
  isClaiming,
  isCancelling,
  isExpiring,
  userAddress,
  isDemoMode = false,
}: EscrowCardProps) {
  const [secret, setSecret] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const getTokenSymbol = (tokenAddress: string) => {
    const token = TOKEN_OPTIONS.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token ? token.symbol : "Unknown";
  };

  const getTokenColor = (tokenAddress: string) => {
    const token = TOKEN_OPTIONS.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token ? token.color : "bg-gray-500";
  };

  const getEscrowStatus = () => {
    if (escrow.claimed) return "Claimed";
    if (escrow.cancelled) return "Cancelled";
    if (Date.now() / 1000 > Number(escrow.expirationTime)) return "Expired";
    return "Active";
  };

  const status = getEscrowStatus();
  const isSender = userAddress?.toLowerCase() === escrow.sender.toLowerCase();
  const isExpired = Date.now() / 1000 > Number(escrow.expirationTime);

  const handleClaim = () => {
    if (secret.trim()) {
      onClaim({ escrowId, secret: secret.trim() });
      setSecret("");
      setShowClaimForm(false);
    }
  };

  const handleCancel = () => {
    onCancel({ escrowId });
  };

  const handleExpire = () => {
    onExpire(escrowId);
  };

  return (
    <div
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 min-w-0 overflow-hidden"
      style={{
        boxShadow:
          "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${getTokenColor(
              escrow.token
            )} rounded-full flex items-center justify-center`}
          >
            <span className="text-white font-bold text-sm">
              {getTokenSymbol(escrow.token)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {formatEther(escrow.amount)} {getTokenSymbol(escrow.token)}
            </h3>
            <p className="text-gray-400 text-sm">ID: #{escrowId}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === "Active"
              ? "bg-green-500/20 text-green-400"
              : status === "Claimed"
              ? "bg-blue-500/20 text-blue-400"
              : status === "Cancelled"
              ? "bg-red-500/20 text-red-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm overflow-hidden">
          <div className="min-w-0 flex flex-col">
            <div className="text-gray-300 text-xs mb-1">Sender</div>
            <div className="text-white font-mono text-xs truncate w-full">
              {escrow.sender.slice(0, 8)}...{escrow.sender.slice(-6)}
            </div>
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="text-gray-300 text-xs mb-1">Expires</div>
            <div className="text-white text-xs truncate w-full">
              {new Date(
                Number(escrow.expirationTime) * 1000
              ).toLocaleDateString()}
            </div>
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="text-gray-300 text-xs mb-1">Amount</div>
            <div className="text-white text-xs truncate w-full">
              {formatEther(escrow.amount)} {getTokenSymbol(escrow.token)}
            </div>
          </div>
        </div>

        {status === "Active" && !isSender && (
          <div className="space-y-2">
            {!showClaimForm ? (
              <button
                onClick={() => setShowClaimForm(true)}
                disabled={isDemoMode}
              >
                <GlowButton
                  variant="red"
                  className="w-full disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
                >
                  {isDemoMode ? "Demo Mode" : "Claim Escrow"}
                </GlowButton>
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter secret to claim"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  disabled={isDemoMode}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-400 outline-none focus:border-white/30 text-sm disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming || !secret.trim() || isDemoMode}
                  >
                    <GlowButton
                      variant="red"
                      className="w-full disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
                    >
                      {isDemoMode
                        ? "Demo Mode"
                        : isClaiming
                        ? "Claiming..."
                        : "Claim"}
                    </GlowButton>
                  </button>
                  <button
                    onClick={() => setShowClaimForm(false)}
                    className="px-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === "Active" && isSender && (
          <div className="space-y-2">
            <button
              onClick={handleCancel}
              disabled={isCancelling || isDemoMode}
            >
              <GlowButton
                variant="red"
                className="w-full disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
              >
                {isDemoMode
                  ? "Demo Mode"
                  : isCancelling
                  ? "Cancelling..."
                  : "Cancel Escrow"}
              </GlowButton>
            </button>
            {isExpired && (
              <button
                onClick={handleExpire}
                disabled={isExpiring || isDemoMode}
              >
                <GlowButton
                  variant="red"
                  className="w-full disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
                >
                  {isDemoMode
                    ? "Demo Mode"
                    : isExpiring
                    ? "Expiring..."
                    : "Expire Escrow"}
                </GlowButton>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-xl transition-all duration-300"
        >
          {showDetails ? "Hide Details" : "View Details"}
        </button>

        {showDetails && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Token Address:</span>
              <span className="text-white font-mono text-xs">
                {escrow.token}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Sender:</span>
              <span className="text-white font-mono text-xs">
                {escrow.sender}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Secret Hash:</span>
              <span className="text-white font-mono text-xs">
                {escrow.secretHash.slice(0, 10)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Expiration:</span>
              <span className="text-white text-xs">
                {new Date(
                  Number(escrow.expirationTime) * 1000
                ).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main MagicLinkEscrow component
export default function MagicLinkEscrow() {
  const { address } = useAccount();
  const [selectedTab, setSelectedTab] = useState("create");
  const [formData, setFormData] = useState({
    token: TOKEN_OPTIONS[0].address,
    amount: "",
    expiration: EXPIRATION_OPTIONS[1].value,
    secret: "",
    recipientEmail: "",
  });
  const [createdEscrowId, setCreatedEscrowId] = useState<number | null>(null);
  const [createdEscrowSecret, setCreatedEscrowSecret] = useState<string>("");
  const [claimFormData, setClaimFormData] = useState({
    escrowId: "",
    secret: "",
  });
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);

  // Hooks
  const {
    escrows,
    userEscrows,
    escrowCount,
    maxExpiration,
    loading: escrowsLoading,
    error: escrowsError,
    refetch,
  } = useMagicLinkEscrow();

  const {
    createEscrow,
    isPending: isCreating,
    isConfirming: isConfirmingCreate,
    isSuccess: isCreateSuccess,
    error: createError,
  } = useCreateEscrow();

  const {
    claimEscrow,
    isPending: isClaiming,
    isConfirming: isConfirmingClaim,
    isSuccess: isClaimSuccess,
    error: claimError,
  } = useClaimEscrow();

  const {
    cancelEscrow,
    isPending: isCancelling,
    isSuccess: isCancelSuccess,
  } = useCancelEscrow();

  const {
    expireEscrow,
    isPending: isExpiring,
    isSuccess: isExpireSuccess,
  } = useExpireEscrow();

  const {
    generateSecret,
    validateSecret,
    validateAmount,
    validateExpirationTime,
    generateMagicLink,
    sendEmail,
  } = useEscrowValidation();

  // Generate secret on component mount (only once)
  useEffect(() => {
    if (!formData.secret) {
      setFormData((prev) => ({ ...prev, secret: generateSecret() }));
    }
  }, [formData.secret, generateSecret]);

  // Check for URL parameters to auto-fill claim form
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const claimEscrowId = urlParams.get("claim");
      const claimSecret = urlParams.get("secret");

      if (claimEscrowId && claimSecret) {
        const decodedSecret = decodeURIComponent(claimSecret);

        setClaimFormData({
          escrowId: claimEscrowId,
          secret: decodedSecret,
        });
        setSelectedTab("claim");
      }
    }
  }, []);

  // Sync carousel index with selected token
  useEffect(() => {
    const tokenIndex = TOKEN_OPTIONS.findIndex(
      (token) => token.address === formData.token
    );
    if (tokenIndex !== -1) {
      setCurrentTokenIndex(tokenIndex);
    }
  }, [formData.token]);

  // Reset form on successful creation and capture escrow ID
  useEffect(() => {
    if (isCreateSuccess) {
      // The new escrow ID is escrowCount + 1 (since contract increments before storing)
      const newEscrowId = escrowCount + 1;

      setCreatedEscrowId(newEscrowId);
      setCreatedEscrowSecret(formData.secret); // Store the secret used for creation

      // Don't reset form immediately if there's an email to send
      if (!formData.recipientEmail) {
        setFormData({
          token: TOKEN_OPTIONS[0].address,
          amount: "",
          expiration: EXPIRATION_OPTIONS[1].value,
          secret: "", // Clear secret, let the mount effect generate a new one
          recipientEmail: "",
        });
      }
      refetch();
    }
  }, [
    isCreateSuccess,
    escrowCount,
    refetch,
    formData.secret,
    formData.recipientEmail,
  ]);

  // Refetch on other successful operations
  useEffect(() => {
    if (isClaimSuccess || isCancelSuccess || isExpireSuccess) {
      refetch();
    }
  }, [isClaimSuccess, isCancelSuccess, isExpireSuccess, refetch]);

  const handleCreateEscrow = async () => {
    if (!validateAmount(formData.amount) || !validateSecret(formData.secret)) {
      console.error("Validation failed:", {
        amount: formData.amount,
        secret: formData.secret,
        amountValid: validateAmount(formData.amount),
        secretValid: validateSecret(formData.secret),
      });
      return;
    }

    const expirationTime =
      formData.expiration === 0
        ? 0
        : Math.floor(Date.now() / 1000) + formData.expiration;

    if (
      expirationTime > 0 &&
      !validateExpirationTime(expirationTime, maxExpiration)
    ) {
      console.error("Expiration validation failed:", {
        expirationTime,
        maxExpiration,
      });
      return;
    }

    console.log("Creating escrow with params:", {
      token: formData.token,
      amount: formData.amount,
      expirationTime,
      secret: formData.secret,
      isETH: formData.token === "0x0000000000000000000000000000000000000000",
    });

    const params: CreateEscrowParams = {
      token: formData.token,
      amount: formData.amount,
      expirationTime,
      secret: formData.secret,
    };

    await createEscrow(params);
  };

  const handleClaimEscrow = async (params: ClaimEscrowParams) => {
    await claimEscrow(params);
  };

  const handleCancelEscrow = async (params: CancelEscrowParams) => {
    await cancelEscrow(params);
  };

  const handleExpireEscrow = async (escrowId: number) => {
    await expireEscrow(escrowId);
  };

  const handleSendEmail = () => {
    if (!createdEscrowId || !address || !formData.recipientEmail) return;

    const expirationTime =
      formData.expiration === 0
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
        : new Date(Date.now() + formData.expiration * 1000);

    const magicLink = generateMagicLink(createdEscrowId, createdEscrowSecret);
    const tokenSymbol = getTokenSymbol(formData.token);

    sendEmail(
      formData.recipientEmail,
      formData.amount,
      tokenSymbol,
      magicLink,
      address,
      expirationTime
    );

    // Clear the email field after a short delay to ensure email is sent first
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, recipientEmail: "" }));
    }, 100);
  };

  const getTokenSymbol = (tokenAddress: string) => {
    const token = TOKEN_OPTIONS.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return token ? token.symbol : "Unknown";
  };

  const isDemoMode = !address;

  // Animation refs - removed useInView to prevent tab switching jitter

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* Static 3D Glass Cards Background */}
      <div className="absolute inset-0 z-0" style={{ perspective: "1000px" }}>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-24 h-32 bg-white/2 backdrop-blur-sm rounded-xl border border-white/5 shadow-xl`}
            style={{
              left: `${8 + i * 14}%`,
              top: `${70 + (i % 2) * 6}%`,
              transform: `translateY(-50%) rotateY(${
                (i - 3) * 10
              }deg) rotateX(5deg) scale(0.7)`,
              transformOrigin: "center center",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 py-8">
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
            Magic Link Escrow
          </motion.h1>
          <motion.p
            className="text-gray-300 text-lg max-w-3xl mx-auto"
            initial={{ opacity: 0, filter: "blur(15px)", y: -15 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Create secure, time-locked escrows with secret-based claiming. Send
            crypto to anyone with just a link.
          </motion.p>
          {isDemoMode && (
            <motion.div
              className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl"
              initial={{ opacity: 0, filter: "blur(10px)", y: -10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-yellow-300 text-sm">
                Demo Mode: Connect your wallet to interact with real contracts
              </p>
            </motion.div>
          )}
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
            {["create", "claim", "my-escrows", "all-escrows"].map(
              (tab, index) => (
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
                  {tab.replace("-", " ")}
                </motion.button>
              )
            )}
          </div>
        </motion.div>

        {/* Create Tab */}
        {selectedTab === "create" && (
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, filter: "blur(20px)", y: 30 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(20px)", y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
              initial={{ opacity: 0, filter: "blur(15px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-8">
                Create Magic Link Escrow
              </h2>

              <div className="space-y-6">
                {/* Token Selection */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Select Token
                  </label>
                  <div className="relative">
                    {/* Carousel Container */}
                    <div className="overflow-hidden rounded-xl bg-white/5 border border-white/10">
                      <motion.div
                        className="flex transition-transform duration-500 ease-in-out"
                        animate={{ x: -currentTokenIndex * 100 + "%" }}
                      >
                        {TOKEN_OPTIONS.map((token, index) => {
                          const isSelected = formData.token === token.address;
                          const isVisible = index === currentTokenIndex;
                          return (
                            <motion.div
                              key={token.symbol}
                              className="min-w-full flex justify-center py-6"
                              initial={false}
                              animate={{
                                scale: isVisible ? 1 : 0.9,
                                opacity: isVisible ? 1 : 0.6,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.button
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    token: token.address,
                                  }));
                                  setCurrentTokenIndex(index);
                                }}
                                className={`relative p-8 rounded-xl border-2 transition-all duration-300 transform ${
                                  isSelected
                                    ? "bg-white/20 border-white/40 text-white shadow-2xl"
                                    : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30"
                                }`}
                                style={{
                                  minWidth: "160px",
                                  boxShadow: isSelected
                                    ? "0 12px 48px rgba(255, 255, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1)"
                                    : "0 4px 16px rgba(0, 0, 0, 0.1)",
                                }}
                                whileHover={{ scale: 1.05, y: -4 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className="text-center">
                                  {token.image ? (
                                    <motion.div
                                      className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-white/10 flex items-center justify-center"
                                      whileHover={{ rotate: 360 }}
                                      transition={{ duration: 0.6 }}
                                    >
                                      <Image
                                        src={token.image}
                                        alt={token.symbol}
                                        width={48}
                                        height={48}
                                        className="rounded-full"
                                      />
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      className={`w-16 h-16 ${token.color} rounded-full mx-auto mb-4 flex items-center justify-center`}
                                      whileHover={{ rotate: 360 }}
                                      transition={{ duration: 0.6 }}
                                    >
                                      <span className="text-white font-bold text-2xl">
                                        {token.symbol.charAt(0)}
                                      </span>
                                    </motion.div>
                                  )}
                                  <span className="font-semibold text-xl block mb-1">
                                    {token.symbol}
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    {token.symbol === "AVAX"
                                      ? "Avalanche"
                                      : token.symbol === "TEST"
                                      ? "Test Token"
                                      : "Governance Token"}
                                  </span>
                                  {isSelected && (
                                    <motion.div
                                      className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 15,
                                      }}
                                    >
                                      <svg
                                        className="w-5 h-5 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </div>

                    {/* Navigation Arrows */}
                    <motion.button
                      onClick={() =>
                        setCurrentTokenIndex(
                          (prev) =>
                            (prev - 1 + TOKEN_OPTIONS.length) %
                            TOKEN_OPTIONS.length
                        )
                      }
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300"
                      whileHover={{ scale: 1.1, x: -2 }}
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </motion.button>

                    <motion.button
                      onClick={() =>
                        setCurrentTokenIndex(
                          (prev) => (prev + 1) % TOKEN_OPTIONS.length
                        )
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300"
                      whileHover={{ scale: 1.1, x: 2 }}
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </motion.button>

                    {/* Indicator Dots */}
                    <div className="flex justify-center mt-4 gap-2">
                      {TOKEN_OPTIONS.map((_, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setCurrentTokenIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentTokenIndex
                              ? "bg-white/80 w-6"
                              : "bg-white/30 hover:bg-white/50"
                          }`}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block flex items-center gap-2">
                    Amount
                    <Tooltip text="Enter the amount of tokens you want to send in the escrow">
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="0.0"
                      disabled={isDemoMode}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30 disabled:opacity-50"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300">
                      {getTokenSymbol(formData.token)}
                    </span>
                  </div>
                </div>

                {/* Expiration Time */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block flex items-center gap-2">
                    Expiration Time
                    <Tooltip text="Set when the escrow will expire. After expiration, the sender can reclaim the funds">
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Tooltip>
                  </label>
                  <select
                    value={formData.expiration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiration: parseInt(e.target.value),
                      }))
                    }
                    disabled={isDemoMode}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-white/30 disabled:opacity-50"
                  >
                    {EXPIRATION_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-gray-800"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secret */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Secret (for claiming)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.secret}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          secret: e.target.value,
                        }))
                      }
                      placeholder="Enter secret or generate one"
                      disabled={isDemoMode}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30 disabled:opacity-50"
                    />
                    <GlowButton
                      variant="red"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          secret: generateSecret(),
                        }))
                      }
                      disabled={isDemoMode}
                      className="px-4  text-white  transition-all duration-300 disabled:opacity-50"
                    >
                      Generate
                    </GlowButton>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Share this secret with the recipient to claim the escrow
                  </p>
                </div>

                {/* Recipient Email (Optional) */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Send via Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recipientEmail: e.target.value,
                      }))
                    }
                    placeholder="recipient@example.com"
                    disabled={isDemoMode}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30 disabled:opacity-50"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    If provided, we&apos;ll open your email client with a
                    pre-filled message containing the magic link
                  </p>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateEscrow}
                  disabled={
                    isCreating ||
                    isConfirmingCreate ||
                    !formData.amount ||
                    !formData.secret ||
                    isDemoMode
                  }
                  className="flex w-full justify-center"
                >
                  <GlowButton
                    variant="red"
                    className="w-full flex justify-center items-center disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
                  >
                    {isDemoMode
                      ? "Demo Mode"
                      : isCreating || isConfirmingCreate
                      ? "Creating Escrow..."
                      : "Create Magic Link Escrow"}
                  </GlowButton>
                </button>

                {/* Error Display */}
                {(createError || escrowsError) && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-300 text-sm">
                      {createError?.message || escrowsError}
                    </p>
                  </div>
                )}

                {/* Success Display with Email Option */}
                {isCreateSuccess && (
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-green-300 text-sm font-medium mb-2">
                          🎉 Escrow created successfully!
                        </p>
                        <p className="text-green-200 text-xs mb-3">
                          Your magic link escrow has been created. You can now
                          share the secret with the recipient or send it via
                          email.
                        </p>

                        {formData.recipientEmail && createdEscrowId && (
                          <div className="space-y-2">
                            <p className="text-green-200 text-xs">
                              📧 Ready to send to: {formData.recipientEmail}
                            </p>
                            <button
                              onClick={handleSendEmail}
                              disabled={isDemoMode}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                            >
                              {isDemoMode
                                ? "Demo Mode"
                                : "📧 Send Magic Link Email"}
                            </button>
                          </div>
                        )}

                        {createdEscrowId && createdEscrowSecret && (
                          <div className="mt-3 p-2 bg-white/10 rounded-lg">
                            <p className="text-green-200 text-xs mb-1">
                              Magic Link:
                            </p>
                            <code className="text-green-100 text-xs break-all">
                              {generateMagicLink(
                                createdEscrowId,
                                createdEscrowSecret
                              )}
                            </code>
                          </div>
                        )}

                        <p className="text-green-200 text-xs mt-2">
                          Check &quot;My Escrows&quot; tab to view and manage
                          your escrow.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Claim Tab */}
        {selectedTab === "claim" && (
          <motion.div
            className="max-w-2xl mx-auto"
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
                Claim Magic Link Escrow
              </h2>

              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Have a Magic Link?
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Enter the escrow details to claim your tokens
                  </p>
                </div>

                {/* Escrow ID Input */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Escrow ID
                  </label>
                  <input
                    type="number"
                    value={claimFormData.escrowId}
                    onChange={(e) =>
                      setClaimFormData((prev) => ({
                        ...prev,
                        escrowId: e.target.value,
                      }))
                    }
                    placeholder="Enter escrow ID"
                    disabled={isDemoMode}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30 disabled:opacity-50"
                  />
                </div>

                {/* Secret Input */}
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Secret
                  </label>
                  <input
                    type="text"
                    value={claimFormData.secret}
                    onChange={(e) =>
                      setClaimFormData((prev) => ({
                        ...prev,
                        secret: e.target.value,
                      }))
                    }
                    placeholder="Enter the secret provided by the sender"
                    disabled={isDemoMode}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 outline-none focus:border-white/30 disabled:opacity-50"
                  />
                </div>

                {/* Escrow Preview */}
                {claimFormData.escrowId &&
                  parseInt(claimFormData.escrowId) > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-2">
                        Escrow Preview
                      </h4>
                      <EscrowPreview
                        escrowId={parseInt(claimFormData.escrowId)}
                      />
                    </div>
                  )}

                {/* Claim Button */}
                <button
                  onClick={() =>
                    handleClaimEscrow({
                      escrowId: parseInt(claimFormData.escrowId),
                      secret: claimFormData.secret,
                    })
                  }
                  disabled={
                    isClaiming ||
                    isConfirmingClaim ||
                    !claimFormData.escrowId ||
                    !claimFormData.secret ||
                    isDemoMode
                  }
                  className="w-full flex justify-center"
                >
                  <GlowButton
                    variant="red"
                    className="w-full flex justify-center items-center disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
                  >
                    {isDemoMode
                      ? "Demo Mode"
                      : isClaiming || isConfirmingClaim
                      ? "Claiming Escrow..."
                      : "🎁 Claim Tokens"}
                  </GlowButton>
                </button>

                {/* Error Display */}
                {claimError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-300 text-sm">{claimError.message}</p>
                  </div>
                )}

                {/* Success Display */}
                {isClaimSuccess && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <p className="text-green-300 text-sm">
                      🎉 Tokens claimed successfully! Check your wallet balance.
                    </p>
                  </div>
                )}

                <div className="text-center text-gray-400 text-sm">
                  <p>
                    Don&apos;t have the secret? Contact the person who sent you
                    the magic link.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* My Escrows Tab */}
        {selectedTab === "my-escrows" && (
          <motion.div
            className="max-w-4xl mx-auto"
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
              initial={{ opacity: 0, filter: "blur(15px)", y: 30 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                My Escrows ({userEscrows.length})
              </h2>

              {escrowsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : userEscrows.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-300">
                    You haven&apos;t created any escrows yet.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto pr-2">
                  {userEscrows
                    .map((escrowId) => {
                      // Contract uses 1-based indexing, so escrowId is the actual contract ID
                      // Array is 0-based, so we need to subtract 1 to get the array index
                      const escrow = escrows[escrowId - 1];
                      return escrow ? { escrow, escrowId } : null;
                    })
                    .filter(
                      (
                        item
                      ): item is { escrow: EscrowDetails; escrowId: number } =>
                        item !== null
                    )
                    .map(({ escrow, escrowId }) => (
                      <EscrowCard
                        key={escrowId}
                        escrow={escrow}
                        escrowId={escrowId}
                        onClaim={handleClaimEscrow}
                        onCancel={handleCancelEscrow}
                        onExpire={handleExpireEscrow}
                        isClaiming={isClaiming}
                        isCancelling={isCancelling}
                        isExpiring={isExpiring}
                        userAddress={address}
                        isDemoMode={isDemoMode}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* All Escrows Tab */}
        {selectedTab === "all-escrows" && (
          <motion.div
            className="max-w-4xl mx-auto"
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
              initial={{ opacity: 0, filter: "blur(15px)", y: 30 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-6">
                All Escrows (
                {
                  escrows.filter((escrow) => {
                    const isExpired =
                      Date.now() / 1000 > Number(escrow.expirationTime);
                    return escrow.claimed || (!escrow.cancelled && !isExpired);
                  }).length
                }
                )
              </h2>

              {escrowsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : escrows.filter((escrow) => {
                  const isExpired =
                    Date.now() / 1000 > Number(escrow.expirationTime);
                  return escrow.claimed || (!escrow.cancelled && !isExpired);
                }).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-300">
                    No active or claimed escrows found.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto pr-2">
                  {escrows
                    .map((escrow, index) => ({ escrow, escrowId: index + 1 }))
                    .filter(({ escrow }) => {
                      // Show only claimed or active escrows (not cancelled or expired)
                      const isExpired =
                        Date.now() / 1000 > Number(escrow.expirationTime);
                      return (
                        escrow.claimed || (!escrow.cancelled && !isExpired)
                      );
                    })
                    .map(({ escrow, escrowId }) => (
                      <EscrowCard
                        key={escrowId}
                        escrow={escrow}
                        escrowId={escrowId}
                        onClaim={handleClaimEscrow}
                        onCancel={handleCancelEscrow}
                        onExpire={handleExpireEscrow}
                        isClaiming={isClaiming}
                        isCancelling={isCancelling}
                        isExpiring={isExpiring}
                        userAddress={address}
                        isDemoMode={isDemoMode}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
