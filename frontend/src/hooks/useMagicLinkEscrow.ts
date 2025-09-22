import { useState, useEffect, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from 'wagmi';
import { parseEther, keccak256, toHex } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import MagicLinkEscrowABI from '@/abis/MagicLinkEscrow.json';

// Type definitions for escrow data
export interface EscrowDetails {
  token: string;
  sender: string;
  amount: bigint;
  expirationTime: bigint;
  claimed: boolean;
  cancelled: boolean;
  secretHash: string;
}

export interface CreateEscrowParams {
  token: string; // address(0) for ETH
  amount: string;
  expirationTime: number; // Unix timestamp
  secret: string; // Will be hashed internally
}

export interface ClaimEscrowParams {
  escrowId: number;
  secret: string;
}

export interface CancelEscrowParams {
  escrowId: number;
}

export interface EmergencyRecoverParams {
  token: string;
  amount: string;
}

// Main hook for MagicLinkEscrow contract interactions
export function useMagicLinkEscrow() {
  const [escrows, setEscrows] = useState<EscrowDetails[]>([]);
  const [userEscrows, setUserEscrows] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const { address } = useAccount();

  // Get escrow count
  const { data: escrowCount } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'escrowCount',
  });

  // Get default expiration
  const { data: defaultExpiration } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'DEFAULT_EXPIRATION',
  });

  // Get max expiration
  const { data: maxExpiration } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'MAX_EXPIRATION',
  });

  // Get owner
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'owner',
  });

  // Fetch all escrows
  const fetchAllEscrows = useCallback(async () => {
    if (!escrowCount || !publicClient || Number(escrowCount) === 0) {
      setEscrows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const escrowData: EscrowDetails[] = [];

      // Contract uses 1-based indexing, so iterate from 1 to escrowCount
      for (let i = 1; i <= Number(escrowCount); i++) {
        try {
          // @ts-expect-error - Wagmi/Viem version compatibility issue
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.MagicLinkEscrow,
            abi: MagicLinkEscrowABI,
            functionName: 'getEscrow',
            args: [BigInt(i)],
          });

          if (result && Array.isArray(result) && result.length >= 7) {
            const escrow: EscrowDetails = {
              token: result[0] as string,
              sender: result[1] as string,
              amount: result[2] as bigint,
              expirationTime: result[3] as bigint,
              claimed: result[4] as boolean,
              cancelled: result[5] as boolean,
              secretHash: result[6] as string,
            };
            escrowData.push(escrow);
          }
        } catch (err) {
          console.error(`Error fetching escrow ${i}:`, err);
        }
      }

      setEscrows(escrowData);
    } catch (err) {
      setError('Failed to fetch escrows');
      console.error('Error fetching escrows:', err);
    } finally {
      setLoading(false);
    }
  }, [escrowCount, publicClient]);

  // Fetch user escrows
  const fetchUserEscrows = useCallback(async () => {
    if (!address || !publicClient) {
      setUserEscrows([]);
      return;
    }

    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'getUserEscrows',
        args: [address],
      });

      if (result && Array.isArray(result)) {
        setUserEscrows(result.map(id => Number(id)));
      }
    } catch (err) {
      console.error('Error fetching user escrows:', err);
      setUserEscrows([]);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchAllEscrows();
  }, [fetchAllEscrows]);

  useEffect(() => {
    fetchUserEscrows();
  }, [fetchUserEscrows]);

  return {
    // Data
    escrows,
    userEscrows,
    escrowCount: Number(escrowCount || 0),
    defaultExpiration: Number(defaultExpiration || 0),
    maxExpiration: Number(maxExpiration || 0),
    owner,
    
    // State
    loading,
    error,
    
    // Actions
    refetch: fetchAllEscrows,
    refetchUserEscrows: fetchUserEscrows,
  };
}

// Hook for creating escrows
export function useCreateEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createEscrow = async (params: CreateEscrowParams) => {
    try {
      const amount = parseEther(params.amount);
      // Create secret hash the same way the contract expects it
      // In Solidity: bytes32 secret = "mySecret123" right-pads with zeros
      // Then: secretHash = keccak256(abi.encodePacked(secret))
      const secretBytes32 = toHex(params.secret.padEnd(32, '\0'), { size: 32 });
      const secretHash = keccak256(secretBytes32);
      
      // Use 0 for default expiration (30 days) as per contract logic
      const expirationTime = params.expirationTime === 0 ? BigInt(0) : BigInt(params.expirationTime);

      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'createEscrow',
        args: [
          params.token as `0x${string}`,
          amount,
          expirationTime,
          secretHash,
        ],
        value: params.token === '0x0000000000000000000000000000000000000000' ? amount : BigInt(0),
      });
    } catch (err) {
      console.error('Error creating escrow:', err);
    }
  };

  return {
    createEscrow,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for claiming escrows
export function useClaimEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimEscrow = async (params: ClaimEscrowParams) => {
    try {
      // The contract expects the raw secret as bytes32
      // It will hash it internally: keccak256(abi.encodePacked(secret))
      // Convert string to bytes32 the same way Solidity does: right-pad with zeros
      const secretBytes32 = toHex(params.secret.padEnd(32, '\0'), { size: 32 });

      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'claimEscrow',
        args: [BigInt(params.escrowId), secretBytes32],
      });
    } catch (err) {
      console.error('Error claiming escrow:', err);
    }
  };

  return {
    claimEscrow,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for cancelling escrows
export function useCancelEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelEscrow = async (params: CancelEscrowParams) => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'cancelEscrow',
        args: [BigInt(params.escrowId)],
      });
    } catch (err) {
      console.error('Error cancelling escrow:', err);
    }
  };

  return {
    cancelEscrow,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for expiring escrows
export function useExpireEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const expireEscrow = async (escrowId: number) => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'expireEscrow',
        args: [BigInt(escrowId)],
      });
    } catch (err) {
      console.error('Error expiring escrow:', err);
    }
  };

  return {
    expireEscrow,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for emergency recovery (owner only)
export function useEmergencyRecover() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const emergencyRecover = async (params: EmergencyRecoverParams) => {
    try {
      const amount = parseEther(params.amount);

      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'emergencyRecover',
        args: [params.token as `0x${string}`, amount],
      });
    } catch (err) {
      console.error('Error in emergency recovery:', err);
    }
  };

  return {
    emergencyRecover,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for ownership management
export function useOwnershipManagement() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transferOwnership = async (newOwner: string) => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'transferOwnership',
        args: [newOwner as `0x${string}`],
      });
    } catch (err) {
      console.error('Error transferring ownership:', err);
    }
  };

  const renounceOwnership = async () => {
    try {
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.MagicLinkEscrow,
        abi: MagicLinkEscrowABI,
        functionName: 'renounceOwnership',
        args: [],
      });
    } catch (err) {
      console.error('Error renouncing ownership:', err);
    }
  };

  return {
    transferOwnership,
    renounceOwnership,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for individual escrow details
export function useEscrowDetails(escrowId: number) {
  const { data: escrowDetails, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'getEscrow',
    args: [BigInt(escrowId)],
  });

  const { data: isClaimable } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'isClaimable',
    args: [BigInt(escrowId)],
  });

  const { data: isExpired } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'isExpired',
    args: [BigInt(escrowId)],
  });

  return {
    escrowDetails: escrowDetails && Array.isArray(escrowDetails) ? {
      token: escrowDetails[0] as string,
      sender: escrowDetails[1] as string,
      amount: escrowDetails[2] as bigint,
      expirationTime: escrowDetails[3] as bigint,
      claimed: escrowDetails[4] as boolean,
      cancelled: escrowDetails[5] as boolean,
      secretHash: escrowDetails[6] as string,
    } : null,
    isClaimable,
    isExpired,
    isLoading,
    error,
  };
}

// Hook for checking if secret is used
export function useSecretUsed(secret: string) {
  const secretHash = secret ? (() => {
    const secretBytes32 = toHex(secret.padEnd(32, '\0'), { size: 32 });
    return keccak256(secretBytes32);
  })() : '0x0000000000000000000000000000000000000000000000000000000000000000';

  const { data: isUsed, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'usedSecrets',
    args: [secretHash as `0x${string}`],
  });

  return {
    isUsed,
    isLoading,
    error,
  };
}

// Hook for user escrow IDs
export function useUserEscrows(userAddress: string) {
  const { data: escrowIds, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.MagicLinkEscrow,
    abi: MagicLinkEscrowABI,
    functionName: 'getUserEscrows',
    args: [userAddress as `0x${string}`],
  });

  return {
    escrowIds: escrowIds && Array.isArray(escrowIds) ? escrowIds.map((id: unknown) => Number(id)) : [],
    isLoading,
    error,
  };
}

// Utility hook for escrow validation and email functionality
export function useEscrowValidation() {
  const validateSecret = (secret: string): boolean => {
    return secret.length > 0 && secret.length <= 32;
  };

  const validateExpirationTime = (expirationTime: number, maxExpiration: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return expirationTime > now && expirationTime <= now + maxExpiration;
  };

  const validateAmount = (amount: string): boolean => {
    try {
      const parsed = parseEther(amount);
      return parsed > BigInt(0);
    } catch {
      return false;
    }
  };

  const generateSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateMagicLink = (escrowId: number, secret: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aura.app';
    const magicLink = `${baseUrl}/magic-links?claim=${escrowId}&secret=${encodeURIComponent(secret)}`;
    
    return magicLink;
  };

  const createEmailContent = (
    recipientEmail: string,
    amount: string,
    tokenSymbol: string,
    magicLink: string,
    senderAddress: string,
    expirationDate: Date
  ) => {
    const subject = `🎁 You've received ${amount} ${tokenSymbol} via Magic Link!`;
    
    const body = `Hi there!

You've received a crypto gift! 🎉

💰 Amount: ${amount} ${tokenSymbol}
🔗 Sender: ${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}
⏰ Expires: ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}

To claim your tokens, simply click the magic link below:
${magicLink}

What you need to do:
1. Click the link above
2. Connect your wallet (or create one if you don't have one)
3. Your tokens will be automatically transferred to your wallet!

No complicated addresses or technical knowledge required - just click and claim!

⚠️ Important: This link will expire on ${expirationDate.toLocaleDateString()}. Make sure to claim your tokens before then!

Happy claiming! 🚀

---
Sent via Aura Protocol - Making crypto accessible to everyone
${typeof window !== 'undefined' ? window.location.origin : 'https://aura.app'}`;

    return { subject, body };
  };

  const sendEmail = (
    recipientEmail: string,
    amount: string,
    tokenSymbol: string,
    magicLink: string,
    senderAddress: string,
    expirationDate: Date
  ) => {
    const { subject, body } = createEmailContent(
      recipientEmail,
      amount,
      tokenSymbol,
      magicLink,
      senderAddress,
      expirationDate
    );

    // Create mailto URL
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open default email client without navigation
    if (typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    return { subject, body, mailtoUrl };
  };

  return {
    validateSecret,
    validateExpirationTime,
    validateAmount,
    generateSecret,
    generateMagicLink,
    createEmailContent,
    sendEmail,
  };
}
