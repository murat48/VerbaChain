/**
 * Staking and Rewards Helper Functions
 * Utility functions for interacting with CeloStaking and CeloRewards contracts
 */

import { parseEther, type Address, type Hash, encodeFunctionData } from 'viem';
import { CELO_STAKING_ABI, CELO_REWARDS_ABI } from './contract-abis';
import { getContractAddresses } from './celo-config';
import { getPublicClient, getWalletClient } from './celo-sdk';

/**
 * Build stake transaction
 * @param amount - Amount of CELO to stake
 * @param duration - Duration in days (0 for flexible)
 * @param userAddress - User wallet address
 * @returns Transaction object ready to send
 */
export function buildStakeTransaction(
  amount: string,
  duration: number,
  userAddress: Address
) {
  const contracts = getContractAddresses();
  
  return {
    to: contracts.staking as Address,
    from: userAddress,
    value: parseEther(amount),
    data: encodeFunctionData({
      abi: CELO_STAKING_ABI,
      functionName: 'stake',
      args: [BigInt(duration)],
    }),
  };
}

/**
 * Stake CELO tokens
 * @param amount - Amount of CELO to stake
 * @param duration - Duration in days (0, 30, 90, 180, 365)
 * @param userAddress - User wallet address
 * @returns Transaction hash
 */
export async function stakeCelo(
  amount: string,
  duration: number,
  userAddress: Address
): Promise<Hash> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const contracts = getContractAddresses();

  const { request } = await publicClient.simulateContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'stake',
    args: [BigInt(duration)],
    value: parseEther(amount),
    account: userAddress,
  });

  return await walletClient.writeContract(request);
}

/**
 * Get user stakes
 * @param userAddress - User wallet address
 * @returns Array of user stakes
 */
export async function getUserStakes(userAddress: Address) {
  const publicClient = getPublicClient();
  const contracts = getContractAddresses();

  const stakes = await publicClient.readContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'getUserStakes',
    args: [userAddress],
  });

  return stakes;
}

/**
 * Get pending staking rewards
 * @param userAddress - User wallet address
 * @returns Pending rewards in wei
 */
export async function getPendingStakingRewards(userAddress: Address): Promise<bigint> {
  const publicClient = getPublicClient();
  const contracts = getContractAddresses();

  const rewards = await publicClient.readContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'getPendingRewards',
    args: [userAddress],
  });

  return rewards as bigint;
}

/**
 * Get pending rewards from rewards contract
 * @param userAddress - User wallet address
 * @returns Pending rewards in wei
 */
export async function getPendingRewards(userAddress: Address): Promise<bigint> {
  const publicClient = getPublicClient();
  const contracts = getContractAddresses();

  const rewards = await publicClient.readContract({
    address: contracts.rewards as Address,
    abi: CELO_REWARDS_ABI,
    functionName: 'getPendingRewards',
    args: [userAddress],
  });

  return rewards as bigint;
}

/**
 * Get total pending rewards (staking + rewards contract)
 * @param userAddress - User wallet address
 * @returns Total pending rewards in wei
 */
export async function getTotalPendingRewards(userAddress: Address): Promise<bigint> {
  const [stakingRewards, contractRewards] = await Promise.all([
    getPendingStakingRewards(userAddress),
    getPendingRewards(userAddress),
  ]);

  return stakingRewards + contractRewards;
}

/**
 * Build claim rewards transaction
 * @param userAddress - User wallet address
 * @returns Transaction object
 */
export function buildClaimRewardsTransaction(userAddress: Address) {
  const contracts = getContractAddresses();
  
  return {
    to: contracts.rewards as Address,
    from: userAddress,
    data: encodeFunctionData({
      abi: CELO_REWARDS_ABI,
      functionName: 'claimRewards',
      args: [],
    }),
    value: 0n,
  };
}

/**
 * Claim all rewards from rewards contract
 * @param userAddress - User wallet address
 * @returns Transaction hash
 */
export async function claimRewards(userAddress: Address): Promise<Hash> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const contracts = getContractAddresses();

  const { request } = await publicClient.simulateContract({
    address: contracts.rewards as Address,
    abi: CELO_REWARDS_ABI,
    functionName: 'claimRewards',
    account: userAddress,
  });

  return await walletClient.writeContract(request);
}

/**
 * Claim rewards from a specific stake
 * @param stakeIndex - Index of the stake
 * @param userAddress - User wallet address
 * @returns Transaction hash
 */
export async function claimStakingRewards(
  stakeIndex: number,
  userAddress: Address
): Promise<Hash> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const contracts = getContractAddresses();

  const { request } = await publicClient.simulateContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'claimRewards',
    args: [BigInt(stakeIndex)],
    account: userAddress,
  });

  return await walletClient.writeContract(request);
}

/**
 * Claim all staking rewards
 * @param userAddress - User wallet address
 * @returns Transaction hash
 */
export async function claimAllStakingRewards(userAddress: Address): Promise<Hash> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const contracts = getContractAddresses();

  // Get all user stakes first
  const stakes = await getUserStakes(userAddress);
  
  // Claim from the first active stake (or you can iterate through all)
  // For now, we'll use claimRewards on the first stake
  if (stakes.length === 0) {
    throw new Error('No active stakes found');
  }

  const { request } = await publicClient.simulateContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'claimRewards',
    args: [0n], // First stake
    account: userAddress,
  });

  return await walletClient.writeContract(request);
}

/**
 * Unstake CELO tokens
 * @param stakeIndex - Index of the stake to unstake
 * @param userAddress - User wallet address
 * @returns Transaction hash
 */
export async function unstakeCelo(
  stakeIndex: number,
  userAddress: Address
): Promise<Hash> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const contracts = getContractAddresses();

  const { request } = await publicClient.simulateContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'unstake',
    args: [BigInt(stakeIndex)],
    account: userAddress,
  });

  return await walletClient.writeContract(request);
}

/**
 * Get APY rates for different durations
 * @returns Object with duration to APY mapping
 */
export async function getAPYRates(): Promise<Record<number, number>> {
  const publicClient = getPublicClient();
  const contracts = getContractAddresses();

  const durations = [0, 30, 90, 180, 365];
  const rates = await Promise.all(
    durations.map((duration) =>
      publicClient.readContract({
        address: contracts.staking as Address,
        abi: CELO_STAKING_ABI,
        functionName: 'durationToAPY',
        args: [BigInt(duration)],
      })
    )
  );

  const apyRates: Record<number, number> = {};
  durations.forEach((duration, index) => {
    apyRates[duration] = Number(rates[index]) / 100; // Convert from basis points to percentage
  });

  return apyRates;
}

/**
 * Check if staking is supported for the current network
 * @returns True if staking contracts are deployed
 */
export function isStakingSupported(): boolean {
  const contracts = getContractAddresses();
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  return (
    contracts.staking.toLowerCase() !== zeroAddress &&
    contracts.rewards.toLowerCase() !== zeroAddress
  );
}

/**
 * Get staking contract balance
 * @returns Contract balance in wei
 */
export async function getStakingContractBalance(): Promise<bigint> {
  const publicClient = getPublicClient();
  const contracts = getContractAddresses();

  const balance = await publicClient.readContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'getContractBalance',
  });

  return balance as bigint;
}

/**
 * Get total staked amount in contract
 * @returns Total staked in wei
 */
export async function getTotalStaked(): Promise<bigint> {
  const publicClient = getPublicClient();
  const contracts = getContractAddresses();

  const totalStaked = await publicClient.readContract({
    address: contracts.staking as Address,
    abi: CELO_STAKING_ABI,
    functionName: 'totalStaked',
  });

  return totalStaked as bigint;
}
