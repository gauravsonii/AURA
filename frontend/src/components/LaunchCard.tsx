import { useState } from "react";
import { formatEther } from "viem";
import { LaunchDetails } from "@/hooks/useLaunchpad";
import toast from "react-hot-toast";
import GlowButton from "./ui/glow-button";

// LaunchCard component for displaying individual launches
interface LaunchCardProps {
  launch: LaunchDetails;
  launchId: number;
  onContribute: (launchId: number, amount: string) => void;
  onFinalize: (launchId: number) => void;
  onCancel: (launchId: number) => void;
  isContributing: boolean;
  isManaging: boolean;
  userAddress?: string;
  isDemoMode?: boolean;
}

export function LaunchCard({
  launch,
  launchId,
  onContribute,
  onFinalize,
  onCancel,
  isContributing,
  isManaging,
  userAddress,
  isDemoMode = false,
}: LaunchCardProps) {
  const [contributionAmount, setContributionAmount] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const getLaunchStatus = () => {
    if (launch.cancelled) return "Cancelled";
    if (launch.launched) return "Launched";
    if (Date.now() / 1000 > Number(launch.endTime)) return "Ended";
    if (Date.now() / 1000 < Number(launch.startTime)) return "Upcoming";
    return "Active";
  };

  const getProgressPercentage = () => {
    const totalValue =
      Number(launch.totalSupply) * Number(launch.pricePerToken);
    const raisedValue = Number(launch.raisedAmount);
    return totalValue > 0 ? (raisedValue / totalValue) * 100 : 0;
  };

  const status = getLaunchStatus();
  const progress = getProgressPercentage();
  const totalValue = Number(launch.totalSupply) * Number(launch.pricePerToken);
  const isCreator = userAddress === launch.creator;

  const handleContribute = () => {
    if (contributionAmount) {
      onContribute(launchId, contributionAmount);
      setContributionAmount("");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 w-full max-w-sm mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{launch.name}</h3>
          <p className="text-gray-400 text-sm">{launch.symbol}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === "Active"
              ? "bg-green-500/20 text-green-400"
              : status === "Upcoming"
              ? "bg-yellow-500/20 text-yellow-400"
              : status === "Launched"
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
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Progress</span>
            <span className="text-white">
              {formatEther(launch.raisedAmount)} /{" "}
              {formatEther(BigInt(totalValue.toString()))} AVAX
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-300 text-xs">Price per Token</div>
            <div className="text-white font-medium">
              {formatEther(launch.pricePerToken)} AVAX
            </div>
          </div>
          <div>
            <div className="text-gray-300 text-xs">Total Supply</div>
            <div className="text-white font-medium">
              {formatEther(launch.totalSupply)}
            </div>
          </div>
        </div>

        {launch.minContribution > 0 && launch.maxContribution > 0 && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-300 text-xs">Min Contribution</div>
              <div className="text-white font-medium">
                {formatEther(launch.minContribution)} AVAX
              </div>
            </div>
            <div>
              <div className="text-gray-300 text-xs">Max Contribution</div>
              <div className="text-white font-medium">
                {formatEther(launch.maxContribution)} AVAX
              </div>
            </div>
          </div>
        )}

        {status === "Active" && (
          <div className="space-y-2">
            <input
              type="number"
              step="0.001"
              placeholder="Contribution amount (AVAX)"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              disabled={isDemoMode}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-400 outline-none focus:border-white/30 text-sm disabled:opacity-50"
            />
            <button
              onClick={handleContribute}
              disabled={isContributing || !contributionAmount || isDemoMode}
              className="w-full  disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
            >
              <GlowButton
                variant="red"
                className="w-full flex justify-center items-center  text-white font-semibold py-2 rounded-xl transition-all duration-300 shadow-lg"
              >
                {isDemoMode
                  ? "Demo Mode"
                  : isContributing
                  ? "Contributing..."
                  : "Contribute"}
              </GlowButton>
            </button>
          </div>
        )}

        {status === "Active" && isCreator && (
          <div className="space-y-2">
            <button
              onClick={() => onFinalize(launchId)}
              disabled={isManaging || isDemoMode}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
            >
              {isDemoMode
                ? "Demo Mode"
                : isManaging
                ? "Processing..."
                : "Finalize Launch"}
            </button>
            <button
              onClick={() => onCancel(launchId)}
              disabled={isManaging || isDemoMode}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 text-white py-2 rounded-xl transition-all duration-300"
            >
              {isDemoMode
                ? "Demo Mode"
                : isManaging
                ? "Processing..."
                : "Cancel Launch"}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-xl transition-all duration-300"
        >
          {showDetails ? "Hide Details" : "View Details"}
        </button>

        {showDetails && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl space-y-3 text-sm">
            <div className="space-y-1">
              <span className="text-gray-300 text-xs">Token Address:</span>
              <div className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                <span className="text-white font-mono text-xs">
                  {truncateAddress(launch.token)}
                </span>
                <button
                  onClick={() => copyToClipboard(launch.token, "Token address")}
                  className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-white/10"
                  title="Copy full address"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-300 text-xs">Creator:</span>
              <div className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                <span className="text-white font-mono text-xs">
                  {truncateAddress(launch.creator)}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(launch.creator, "Creator address")
                  }
                  className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-white/10"
                  title="Copy full address"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-gray-300 text-xs">Liquidity Pool:</span>
              <div className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                <span className="text-white font-mono text-xs">
                  {truncateAddress(launch.liquidityPool)}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      launch.liquidityPool,
                      "Liquidity pool address"
                    )
                  }
                  className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-white/10"
                  title="Copy full address"
                >
                  📋
                </button>
              </div>
            </div>
            {launch.startTime > 0 && (
              <div className="space-y-1">
                <span className="text-gray-300 text-xs">Start Time:</span>
                <div className="text-white text-xs bg-white/5 p-2 rounded border border-white/10">
                  {new Date(Number(launch.startTime) * 1000).toLocaleString()}
                </div>
              </div>
            )}
            {launch.endTime > 0 && (
              <div className="space-y-1">
                <span className="text-gray-300 text-xs">End Time:</span>
                <div className="text-white text-xs bg-white/5 p-2 rounded border border-white/10">
                  {new Date(Number(launch.endTime) * 1000).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
