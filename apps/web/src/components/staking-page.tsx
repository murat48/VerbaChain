'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import {
  getUserStakes,
  getPendingStakingRewards,
  getPendingRewards,
  unstakeCelo,
  claimStakingRewards,
  claimRewards,
  getAPYRates,
  getTotalStaked,
  isStakingSupported,
} from '@/utils/staking-helpers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stake {
  amount: bigint;
  startTime: bigint;
  duration: bigint;
  rewardRate: bigint;
  active: boolean;
}

export function StakingPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [pendingStakingRewards, setPendingStakingRewards] = useState<bigint>(0n);
  const [pendingContractRewards, setPendingContractRewards] = useState<bigint>(0n);
  const [apyRates, setApyRates] = useState<Record<number, number>>({});
  const [totalStaked, setTotalStaked] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [claimingIndex, setClaimingIndex] = useState<number | null>(null);
  const [unstakingIndex, setUnstakingIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address && isStakingSupported()) {
      loadStakingData();
    }
  }, [mounted, isConnected, address]);

  const loadStakingData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const [stakesData, stakingRewards, contractRewards, rates, total] = await Promise.all([
        getUserStakes(address),
        getPendingStakingRewards(address),
        getPendingRewards(address),
        getAPYRates(),
        getTotalStaked(),
      ]);

      setStakes(stakesData as Stake[]);
      setPendingStakingRewards(stakingRewards);
      setPendingContractRewards(contractRewards);
      setApyRates(rates);
      setTotalStaked(total);
    } catch (error) {
      console.error('Failed to load staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimStakingRewards = async (index: number) => {
    if (!address) return;
    
    setClaimingIndex(index);
    try {
      const txHash = await claimStakingRewards(index, address);
      console.log('Claim transaction:', txHash);
      
      // Wait a bit and reload data
      setTimeout(() => loadStakingData(), 3000);
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      alert('Failed to claim rewards: ' + (error as Error).message);
    } finally {
      setClaimingIndex(null);
    }
  };

  const handleClaimContractRewards = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const txHash = await claimRewards(address);
      console.log('Claim transaction:', txHash);
      
      // Wait a bit and reload data
      setTimeout(() => loadStakingData(), 3000);
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      alert('Failed to claim rewards: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (index: number) => {
    if (!address) return;
    
    const stake = stakes[index];
    const lockEndTime = Number(stake.startTime) + Number(stake.duration) * 86400;
    const now = Math.floor(Date.now() / 1000);
    
    if (stake.duration > 0n && now < lockEndTime) {
      const remainingDays = Math.ceil((lockEndTime - now) / 86400);
      if (!confirm(`This stake is still locked for ${remainingDays} days. Are you sure you want to try to unstake?`)) {
        return;
      }
    }
    
    setUnstakingIndex(index);
    try {
      const txHash = await unstakeCelo(index, address);
      console.log('Unstake transaction:', txHash);
      
      // Wait a bit and reload data
      setTimeout(() => loadStakingData(), 3000);
    } catch (error) {
      console.error('Failed to unstake:', error);
      alert('Failed to unstake: ' + (error as Error).message);
    } finally {
      setUnstakingIndex(null);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateReward = (stake: Stake) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const stakingDuration = now - stake.startTime;
    const reward = (stake.amount * stake.rewardRate * stakingDuration) / (BigInt(365 * 24 * 60 * 60) * 10000n);
    return reward;
  };

  // Wait for client-side mount
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="animate-pulse">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your staking positions</p>
        </Card>
      </div>
    );
  }

  if (!isStakingSupported()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Staking Not Available</h2>
          <p className="text-gray-600">Staking contracts are not deployed on this network</p>
        </Card>
      </div>
    );
  }

  const totalPendingRewards = pendingStakingRewards + pendingContractRewards;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">🔒 My Staking</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">Total Staked</div>
          <div className="text-3xl font-bold">{formatEther(totalStaked)} CELO</div>
        </Card>
        
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-2">My Stakes</div>
          <div className="text-3xl font-bold">{stakes.filter(s => s.active).length}</div>
        </Card>
        
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-sm text-green-700 mb-2">Pending Rewards</div>
          <div className="text-3xl font-bold text-green-600">
            {formatEther(totalPendingRewards)} CELO
          </div>
          {totalPendingRewards > 0n && (
            <Button
              onClick={handleClaimContractRewards}
              disabled={loading}
              className="mt-4 w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? '⏳ Claiming...' : '🎁 Claim All Rewards'}
            </Button>
          )}
        </Card>
      </div>

      {/* APY Rates */}
      <Card className="p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">📊 Current APY Rates</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(apyRates).map(([duration, apy]) => (
            <div key={duration} className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">
                {duration === '0' ? 'Flexible' : `${duration} days`}
              </div>
              <div className="text-2xl font-bold text-blue-600">{apy}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stakes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Stakes</h2>
          <Button onClick={loadStakingData} disabled={loading} variant="outline">
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </Button>
        </div>

        {loading && stakes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-600">Loading your stakes...</div>
          </Card>
        ) : stakes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-xl mb-2">No stakes yet</div>
            <div className="text-gray-600 mb-4">Start staking CELO to earn rewards!</div>
            <Button onClick={() => window.location.href = '/nlte'}>
              Go to NLTE
            </Button>
          </Card>
        ) : (
          stakes.map((stake, index) => {
            const reward = calculateReward(stake);
            const lockEndTime = Number(stake.startTime) + Number(stake.duration) * 86400;
            const now = Math.floor(Date.now() / 1000);
            const isLocked = stake.duration > 0n && now < lockEndTime;
            const remainingDays = isLocked ? Math.ceil((lockEndTime - now) / 86400) : 0;

            return (
              <Card key={index} className={`p-6 ${!stake.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl font-bold">Stake #{index}</div>
                      {stake.active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          Inactive
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          🔒 Locked {remainingDays}d
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Amount</div>
                        <div className="text-lg font-bold">{formatEther(stake.amount)} CELO</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="text-lg font-bold">
                          {stake.duration === 0n ? 'Flexible' : `${stake.duration} days`}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">APY</div>
                        <div className="text-lg font-bold text-blue-600">
                          {Number(stake.rewardRate) / 100}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Pending Rewards</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatEther(reward)} CELO
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      Staked on: {formatTimestamp(stake.startTime)}
                    </div>
                  </div>

                  {stake.active && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleClaimStakingRewards(index)}
                        disabled={claimingIndex === index || reward === 0n}
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        {claimingIndex === index ? '⏳ Claiming...' : '🎁 Claim'}
                      </Button>
                      
                      <Button
                        onClick={() => handleUnstake(index)}
                        disabled={unstakingIndex === index}
                        size="sm"
                        variant="destructive"
                        className="whitespace-nowrap"
                      >
                        {unstakingIndex === index ? '⏳ Unstaking...' : '🔓 Unstake'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Additional Info */}
      <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold mb-2">ℹ️ Staking Info</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Flexible staking (0 days) allows you to unstake anytime</li>
          <li>• Fixed-term staking offers higher APY but locks your tokens</li>
          <li>• You can claim rewards without unstaking</li>
          <li>• Rewards are calculated continuously based on your staking duration</li>
          <li>• Use NLTE to stake: "Stake 100 CELO" or "Stake 500 CELO for 30 days"</li>
        </ul>
      </Card>
    </div>
  );
}
