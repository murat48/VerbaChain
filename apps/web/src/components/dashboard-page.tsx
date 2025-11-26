'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  getUserStakes,
  getPendingStakingRewards,
  getPendingRewards,
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

export function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [pendingStakingRewards, setPendingStakingRewards] = useState<bigint>(0n);
  const [pendingContractRewards, setPendingContractRewards] = useState<bigint>(0n);
  const [apyRates, setApyRates] = useState<Record<number, number>>({});
  const [totalStaked, setTotalStaked] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address && isStakingSupported()) {
      loadDashboardData();
    }
  }, [mounted, isConnected, address]);

  const loadDashboardData = async () => {
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
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate user's total staked amount
  const userTotalStaked = stakes
    .filter(s => s.active)
    .reduce((sum, stake) => sum + stake.amount, 0n);

  // Calculate total rewards earned (simulated historical data)
  const totalRewards = pendingStakingRewards + pendingContractRewards;

  // Calculate average APY
  const avgAPY = stakes.length > 0
    ? stakes.reduce((sum, stake) => sum + Number(stake.rewardRate), 0) / stakes.length / 100
    : 0;

  // Generate earnings chart data (last 30 days simulation)
  const earningsChartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const earnings = Number(totalRewards) * (i / 30);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      earnings: Number((earnings / 1e18).toFixed(2)),
    };
  });

  // APY comparison data
  const apyComparisonData = Object.entries(apyRates).map(([duration, apy]) => ({
    duration: duration === '0' ? 'Flexible' : `${duration}d`,
    apy,
  }));

  // Stake distribution data
  const stakeDistributionData = stakes
    .filter(s => s.active)
    .map((stake, index) => ({
      name: `Stake #${index}`,
      amount: Number(formatEther(stake.amount)),
    }));

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
          <p className="text-gray-600">Please connect your wallet to view your dashboard</p>
        </Card>
      </div>
    );
  }

  if (!isStakingSupported()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Dashboard Not Available</h2>
          <p className="text-gray-600">Staking contracts are not deployed on this network</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">📊 Dashboard</h1>
        <Button onClick={loadDashboardData} disabled={loading} variant="outline">
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-sm text-blue-700 mb-2">💰 Total Staked</div>
          <div className="text-3xl font-bold text-blue-900">{formatEther(userTotalStaked)}</div>
          <div className="text-sm text-blue-600 mt-1">CELO</div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-sm text-green-700 mb-2">🎁 Pending Rewards</div>
          <div className="text-3xl font-bold text-green-900">{formatEther(totalRewards)}</div>
          <div className="text-sm text-green-600 mt-1">CELO</div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-sm text-purple-700 mb-2">📈 Average APY</div>
          <div className="text-3xl font-bold text-purple-900">{avgAPY.toFixed(2)}%</div>
          <div className="text-sm text-purple-600 mt-1">Annual Yield</div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-sm text-orange-700 mb-2">🔒 Active Stakes</div>
          <div className="text-3xl font-bold text-orange-900">{stakes.filter(s => s.active).length}</div>
          <div className="text-sm text-orange-600 mt-1">Positions</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">📈 Earnings Over Time (30 Days)</h3>
          {earningsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={earningsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No earnings data yet
            </div>
          )}
        </Card>

        {/* APY Comparison Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">🎯 APY Comparison</h3>
          {apyComparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={apyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="duration" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="apy" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No APY data available
            </div>
          )}
        </Card>
      </div>

      {/* Portfolio Overview */}
      <Card className="p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">💼 Portfolio Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Network Total Staked</div>
            <div className="text-2xl font-bold">{formatEther(totalStaked)} CELO</div>
            <div className="text-sm text-gray-500 mt-1">
              Your share: {totalStaked > 0n ? ((Number(userTotalStaked) / Number(totalStaked)) * 100).toFixed(4) : 0}%
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-2">Estimated Monthly Earnings</div>
            <div className="text-2xl font-bold text-green-600">
              {(Number(userTotalStaked) * avgAPY / 100 / 12 / 1e18).toFixed(4)} CELO
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Based on current APY
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-2">Estimated Annual Earnings</div>
            <div className="text-2xl font-bold text-blue-600">
              {(Number(userTotalStaked) * avgAPY / 100 / 1e18).toFixed(4)} CELO
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Based on current APY
            </div>
          </div>
        </div>
      </Card>

      {/* Stake Distribution */}
      {stakeDistributionData.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">🥧 Stake Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stakeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8b5cf6" name="Amount (CELO)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-xl font-bold mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => window.location.href = '/nlte'}
            className="h-20 text-lg bg-blue-600 hover:bg-blue-700"
          >
            🚀 Stake CELO
          </Button>
          <Button 
            onClick={() => window.location.href = '/staking'}
            className="h-20 text-lg bg-purple-600 hover:bg-purple-700"
          >
            🔒 View Stakes
          </Button>
          <Button 
            onClick={() => window.location.href = '/history'}
            className="h-20 text-lg bg-indigo-600 hover:bg-indigo-700"
          >
            📜 View History
          </Button>
        </div>
      </Card>
    </div>
  );
}
