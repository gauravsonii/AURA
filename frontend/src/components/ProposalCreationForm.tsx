"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import GovernanceABI from "@/abis/Governance.json";
import toast from "react-hot-toast";

interface ProposalCreationFormProps {
  onProposalCreated: () => void;
  onClose: () => void;
}

export default function ProposalCreationForm({
  onProposalCreated,
  onClose,
}: ProposalCreationFormProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [formData, setFormData] = useState({
    description: "",
    newFee: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.newFee.trim()) {
      newErrors.newFee = "New fee is required";
    } else {
      const fee = parseInt(formData.newFee);
      if (isNaN(fee) || fee < 0 || fee > 10000) {
        newErrors.newFee =
          "Fee must be between 0 and 10000 basis points (0-100%)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first!");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const loadingToast = toast.loading("Creating proposal...");

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.Governance as `0x${string}`,
        abi: GovernanceABI,
        functionName: "createProposal",
        args: [formData.description.trim(), BigInt(formData.newFee)],
        chain: avalancheFuji,
        account: address as `0x${string}`,
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal. Please try again.", {
        id: loadingToast,
      });
    }
  };

  // Handle transaction confirmation
  if (isConfirmed && hash) {
    toast.success("Proposal created successfully!", { id: hash });
    onProposalCreated();
    onClose();
  }

  if (error) {
    console.error("Proposal creation error:", error);
    toast.error(
      `Failed to create proposal: ${error.message || "Unknown error"}`
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2
            className="text-3xl font-bold text-white"
            style={{
              fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
            }}
          >
            Create New Proposal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:bg-red-500/10 rounded-lg p-2"
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-3"
            >
              Proposal Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what this proposal aims to achieve..."
              className={`w-full px-4 py-4 bg-black/20 backdrop-blur-md border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-black/30 transition-all duration-300 ${
                errors.description ? "border-red-500/50" : "border-red-500/20"
              }`}
              rows={4}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-2">{errors.description}</p>
            )}
          </div>

          {/* New Fee Field */}
          <div>
            <label
              htmlFor="newFee"
              className="block text-sm font-medium text-gray-300 mb-3"
            >
              New Fee (Basis Points) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="newFee"
                value={formData.newFee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, newFee: e.target.value }))
                }
                placeholder="e.g., 300 (for 3%)"
                min="0"
                max="10000"
                className={`w-full px-4 py-4 bg-black/20 backdrop-blur-md border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-black/30 transition-all duration-300 ${
                  errors.newFee ? "border-red-500/50" : "border-red-500/20"
                }`}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                bp
              </div>
            </div>
            {errors.newFee && (
              <p className="text-red-400 text-sm mt-2">{errors.newFee}</p>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Basis points: 100 = 1%, 300 = 3%, 1000 = 10%
            </p>
          </div>

          {/* Requirements Info */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-md border border-red-500/20 rounded-xl p-6">
            <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Requirements
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                You need at least 1,000 AURA tokens to create a proposal
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                Voting period is 7 days
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                Proposals require more &quot;For&quot; votes than
                &quot;Against&quot; to pass
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                Anyone can vote if they have voting power
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-black/20 hover:bg-black/30 border border-red-500/20 text-white font-medium rounded-xl transition-all duration-300 hover:border-red-500/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600/20 to-red-500/20 hover:from-red-600/30 hover:to-red-500/30 border border-red-500/30 text-red-400 font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
            >
              {isPending || isConfirming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Proposal
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
