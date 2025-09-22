import { useState, useEffect, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import LaunchpadABI from '@/abis/Launchpad.json';

export interface LaunchDetails {
  token: string;
  creator: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  pricePerToken: bigint;
  raisedAmount: bigint;
  launched: boolean;
  cancelled: boolean;
  minContribution: bigint;
  maxContribution: bigint;
  startTime: bigint;
  endTime: bigint;
  liquidityPool: string;
}

export interface LaunchFormData {
  name: string;
  symbol: string;
  totalSupply: string;
  pricePerToken: string;
  minContribution: string;
  maxContribution: string;
  duration: string;
}

export function useLaunchpad() {
  const [launches, setLaunches] = useState<LaunchDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  // Get launch count with error handling
  const { data: launchCount, error: launchCountError } = useReadContract({
    address: CONTRACT_ADDRESSES.Launchpad,
    abi: LaunchpadABI,
    functionName: 'launchCount',
  });

  // Get all launches
  const fetchLaunches = useCallback(async () => {
    // Check for launch count error first
    if (launchCountError) {
      setError(`Failed to connect to contract: ${launchCountError.message}`);
      setLoading(false);
      return;
    }

    if (!launchCount || !publicClient || Number(launchCount) === 0) {
      setLaunches([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const launchData: LaunchDetails[] = [];
      const launchPromises = [];
      for (let i = 0; i < Number(launchCount); i++) {
        launchPromises.push(
          // @ts-expect-error - Wagmi/Viem version compatibility issue
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.Launchpad,
            abi: LaunchpadABI,
            functionName: 'launches',
            args: [BigInt(i)],
          }).catch(err => {
            console.error(`Error fetching launch ${i}:`, err);
            return null;
          })
        );
      }

      const results = await Promise.all(launchPromises);
      
      // Fetch cancelled status for each launch
      const cancelledPromises = [];
      for (let i = 0; i < Number(launchCount); i++) {
        cancelledPromises.push(
          // @ts-expect-error - Wagmi/Viem version compatibility issue
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.Launchpad,
            abi: LaunchpadABI,
            functionName: 'isLaunchCancelled',
            args: [BigInt(i)],
          }).catch(err => {
            console.error(`Error fetching cancelled status for launch ${i}:`, err);
            return false;
          })
        );
      }

      const cancelledResults = await Promise.all(cancelledPromises);
      
      results.forEach((result, index) => {
        if (result && Array.isArray(result) && result.length >= 12) {
          const launch: LaunchDetails = {
            token: result[0] as string,
            creator: result[1] as string,
            name: result[2] as string,
            symbol: result[3] as string,
            totalSupply: result[4] as bigint,
            pricePerToken: result[5] as bigint,
            minContribution: result[6] as bigint,
            maxContribution: result[7] as bigint,
            startTime: result[8] as bigint,
            endTime: result[9] as bigint,
            raisedAmount: result[10] as bigint,
            launched: result[11] as boolean,
            cancelled: Boolean(cancelledResults[index]) || false,
            liquidityPool: CONTRACT_ADDRESSES.LiquidityPool,
          };
          launchData.push(launch);
        }
      });
      
      setLaunches(launchData);
    } catch (err) {
      setError('Failed to fetch launches. Please check your network connection and try again.');
      console.error('Error fetching launches:', err);
    } finally {
      setLoading(false);
    }
  }, [launchCount, publicClient, launchCountError]);

  useEffect(() => {
    console.log('Launchpad hook effect triggered:', { launchCount, publicClient: !!publicClient, launchCountError });
    fetchLaunches();
  }, [fetchLaunches, launchCount, publicClient, launchCountError]);

  // Fallback data for demo purposes when contract is not accessible
  const getFallbackLaunches = (): LaunchDetails[] => [
    {
      token: "0x1234567890123456789012345678901234567890",
      creator: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      name: "Demo Token",
      symbol: "DEMO",
      totalSupply: BigInt(1000000 * 10**18),
      pricePerToken: BigInt(1 * 10**15), // 0.001 AVAX
      raisedAmount: BigInt(500 * 10**18), // 500 AVAX raised
      launched: false,
      cancelled: false,
      minContribution: BigInt(1 * 10**15), // 0.001 AVAX
      maxContribution: BigInt(10 * 10**18), // 10 AVAX
      startTime: BigInt(Math.floor(Date.now() / 1000) - 24 * 60 * 60), // Started 1 day ago
      endTime: BigInt(Math.floor(Date.now() / 1000) + 6 * 24 * 60 * 60), // Ends in 6 days
      liquidityPool: CONTRACT_ADDRESSES.LiquidityPool,
    },
    {
      token: "0x2345678901234567890123456789012345678901",
      creator: "0xbcdefabcdefabcdefabcdefabcdefabcdefabcde",
      name: "Test Coin",
      symbol: "TEST",
      totalSupply: BigInt(500000 * 10**18),
      pricePerToken: BigInt(2 * 10**15), // 0.002 AVAX
      raisedAmount: BigInt(0), // No contributions yet
      launched: false,
      cancelled: false,
      minContribution: BigInt(5 * 10**15), // 0.005 AVAX
      maxContribution: BigInt(50 * 10**18), // 50 AVAX
      startTime: BigInt(Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60), // Starts in 2 days
      endTime: BigInt(Math.floor(Date.now() / 1000) + 9 * 24 * 60 * 60), // Ends in 9 days
      liquidityPool: CONTRACT_ADDRESSES.LiquidityPool,
    },
    {
      token: "0x3456789012345678901234567890123456789012",
      creator: "0xcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      name: "Ended Token",
      symbol: "ENDED",
      totalSupply: BigInt(200000 * 10**18),
      pricePerToken: BigInt(5 * 10**15), // 0.005 AVAX
      raisedAmount: BigInt(1000 * 10**18), // 1000 AVAX raised
      launched: false,
      cancelled: false,
      minContribution: BigInt(1 * 10**15), // 0.001 AVAX
      maxContribution: BigInt(20 * 10**18), // 20 AVAX
      startTime: BigInt(Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60), // Started 10 days ago
      endTime: BigInt(Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60), // Ended 1 day ago
      liquidityPool: CONTRACT_ADDRESSES.LiquidityPool,
    }
  ];

  // Enhanced refetch function that also refreshes the launch count
  const refetch = useCallback(async () => {
    console.log('Refetching launches...');
    
    // First, try to get the latest launch count directly
    if (publicClient) {
      try {
        // @ts-expect-error - Wagmi/Viem version compatibility issue
        const latestCount = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.Launchpad,
          abi: LaunchpadABI,
          functionName: 'launchCount',
        });
        console.log('Latest launch count:', Number(latestCount));
        
        // If the count has changed, fetch all launches
        if (Number(latestCount) !== Number(launchCount)) {
          console.log('Launch count changed, refetching all launches...');
          await fetchLaunches();
        } else {
          // Just refetch the existing launches
          await fetchLaunches();
        }
      } catch (err) {
        console.error('Error getting latest launch count:', err);
        // Fallback to regular fetch
        await fetchLaunches();
      }
    } else {
      await fetchLaunches();
    }
  }, [fetchLaunches, publicClient, launchCount]);

  return {
    launches: error && launches.length === 0 ? getFallbackLaunches() : launches,
    launchCount: Number(launchCount || 0) || (error ? 3 : 0),
    loading,
    error,
    refetch,
  };
}

export function useCreateTokenAndLaunch() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createTokenAndLaunch = async (formData: LaunchFormData) => {
    try {
      const totalSupply = parseEther(formData.totalSupply);
      const pricePerToken = parseEther(formData.pricePerToken);
      const minContribution = parseEther(formData.minContribution);
      const maxContribution = parseEther(formData.maxContribution);
      const duration = BigInt(parseInt(formData.duration) * 24 * 60 * 60); // Convert days to seconds

      // Calculate launch fee (10% of total supply * price per token)
      const launchFee = (totalSupply * pricePerToken) / BigInt(10);

      toast.loading('Creating token and launch...', { id: 'create-launch' });

      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Launchpad,
        abi: LaunchpadABI,
        functionName: 'createTokenAndLaunch',
        args: [
          formData.name,
          formData.symbol,
          totalSupply,
          pricePerToken,
          minContribution,
          maxContribution,
          duration,
        ],
        value: launchFee,
      });
    } catch (err) {
      console.error('Error creating token and launch:', err);
      toast.error('Failed to create token and launch', { id: 'create-launch' });
    }
  };

  // Show success/error toasts based on transaction status
  useEffect(() => {
    if (isSuccess) {
      toast.success('Token created and launch started successfully!', { id: 'create-launch' });
    } else if (error) {
      toast.error(`Transaction failed: ${error.message}`, { id: 'create-launch' });
    }
  }, [isSuccess, error]);

  return {
    createTokenAndLaunch,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useContribute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const contribute = async (launchId: number, amount: string) => {
    try {
      const contributionAmount = parseEther(amount);
      
      toast.loading(`Contributing ${amount} AVAX to launch...`, { id: 'contribute' });
      
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Launchpad,
        abi: LaunchpadABI,
        functionName: 'contribute',
        args: [BigInt(launchId), contributionAmount],
      });
    } catch (err) {
      console.error('Error contributing to launch:', err);
      toast.error('Failed to contribute to launch', { id: 'contribute' });
    }
  };

  // Show success/error toasts based on transaction status
  useEffect(() => {
    if (isSuccess) {
      toast.success('Contribution successful!', { id: 'contribute' });
    } else if (error) {
      toast.error(`Contribution failed: ${error.message}`, { id: 'contribute' });
    }
  }, [isSuccess, error]);

  return {
    contribute,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useLaunchManagement() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const finalizeLaunch = async (launchId: number) => {
    try {
      toast.loading('Finalizing launch...', { id: 'finalize-launch' });
      
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Launchpad,
        abi: LaunchpadABI,
        functionName: 'finalizeLaunch',
        args: [BigInt(launchId)],
      });
    } catch (err) {
      console.error('Error finalizing launch:', err);
      toast.error('Failed to finalize launch', { id: 'finalize-launch' });
    }
  };

  const cancelLaunch = async (launchId: number) => {
    try {
      toast.loading('Cancelling launch...', { id: 'cancel-launch' });
      
      // @ts-expect-error - Wagmi/Viem version compatibility issue
      await writeContract({
        address: CONTRACT_ADDRESSES.Launchpad,
        abi: LaunchpadABI,
        functionName: 'cancelLaunch',
        args: [BigInt(launchId)],
      });
    } catch (err) {
      console.error('Error cancelling launch:', err);
      toast.error('Failed to cancel launch', { id: 'cancel-launch' });
    }
  };

  // Show success/error toasts based on transaction status
  useEffect(() => {
    if (isSuccess) {
      toast.success('Launch action completed successfully!', { id: 'launch-action' });
    } else if (error) {
      toast.error(`Launch action failed: ${error.message}`, { id: 'launch-action' });
    }
  }, [isSuccess, error]);

  return {
    finalizeLaunch,
    cancelLaunch,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useLaunchDetails(launchId: number) {
  const { data: launchDetails, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.Launchpad,
    abi: LaunchpadABI,
    functionName: 'getLaunchDetails',
    args: [BigInt(launchId)],
  });

  const { data: isLaunched } = useReadContract({
    address: CONTRACT_ADDRESSES.Launchpad,
    abi: LaunchpadABI,
    functionName: 'isLaunchLaunched',
    args: [BigInt(launchId)],
  });

  const { data: isCancelled } = useReadContract({
    address: CONTRACT_ADDRESSES.Launchpad,
    abi: LaunchpadABI,
    functionName: 'isLaunchCancelled',
    args: [BigInt(launchId)],
  });

  return {
    launchDetails,
    isLaunched,
    isCancelled,
    isLoading,
    error,
  };
}
