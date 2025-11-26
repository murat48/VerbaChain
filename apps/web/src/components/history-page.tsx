'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther, parseAbiItem } from 'viem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContractAddresses } from '@/utils/celo-config';
import { isStakingSupported, getUserStakes } from '@/utils/staking-helpers';

interface Transaction {
  hash: string;
  blockNumber: bigint;
  timestamp: number;
  type: 'STAKE' | 'UNSTAKE' | 'CLAIM_REWARDS';
  amount: bigint;
  status: 'success' | 'pending' | 'failed';
  from: string;
  to: string;
  gasUsed?: bigint;
}

export function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeStakes, setActiveStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'STAKE' | 'UNSTAKE' | 'CLAIM_REWARDS'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected && address && isStakingSupported()) {
      loadTransactionHistory();
    }
  }, [mounted, isConnected, address]);

  const loadTransactionHistory = async () => {
    if (!address || !publicClient) return;
    
    setLoading(true);
    try {
      const contracts = getContractAddresses();
      if (!contracts) {
        setTransactions([]);
        return;
      }

      const currentBlock = await publicClient.getBlockNumber();
      // Increase to 100k blocks (~1-2 months on Celo testnet)
      // If needed, can be made configurable
      const fromBlock = currentBlock - 100000n > 0n ? currentBlock - 100000n : 0n;

      // Fetch Staked events
      const stakedLogs = await publicClient.getLogs({
        address: contracts.staking as `0x${string}`,
        event: parseAbiItem('event Staked(address indexed user, uint256 amount, uint256 duration, uint256 rewardRate)'),
        args: { user: address },
        fromBlock,
        toBlock: 'latest',
      });

      // Fetch Unstaked events
      const unstakedLogs = await publicClient.getLogs({
        address: contracts.staking as `0x${string}`,
        event: parseAbiItem('event Unstaked(address indexed user, uint256 amount)'),
        args: { user: address },
        fromBlock,
        toBlock: 'latest',
      });

      // Fetch RewardsClaimed events
      const rewardsLogs = await publicClient.getLogs({
        address: contracts.staking as `0x${string}`,
        event: parseAbiItem('event RewardsClaimed(address indexed user, uint256 amount)'),
        args: { user: address },
        fromBlock,
        toBlock: 'latest',
      });

      // Convert logs to transactions
      const allTxs: Transaction[] = [];

      // Process staked events
      for (const log of stakedLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        allTxs.push({
          hash: log.transactionHash || '',
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
          type: 'STAKE',
          amount: (log.args as any).amount || 0n,
          status: 'success',
          from: address,
          to: contracts.staking,
        });
      }

      // Process unstaked events
      for (const log of unstakedLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        allTxs.push({
          hash: log.transactionHash || '',
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
          type: 'UNSTAKE',
          amount: (log.args as any).amount || 0n,
          status: 'success',
          from: address,
          to: contracts.staking,
        });
      }

      // Process rewards events
      for (const log of rewardsLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        allTxs.push({
          hash: log.transactionHash || '',
          blockNumber: log.blockNumber,
          timestamp: Number(block.timestamp),
          type: 'CLAIM_REWARDS',
          amount: (log.args as any).amount || 0n,
          status: 'success',
          from: contracts.staking,
          to: address,
        });
      }

      // Sort by timestamp (newest first)
      allTxs.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTxs);

      // Load active stakes
      try {
        const stakes = await getUserStakes(address as `0x${string}`);
        setActiveStakes(stakes as any[]);
      } catch (error) {
        console.error('Failed to load active stakes:', error);
        setActiveStakes([]);
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount (CELO)', 'Status', 'Transaction Hash'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.timestamp * 1000).toLocaleString(),
      tx.type,
      formatEther(tx.amount),
      tx.status,
      tx.hash,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staking-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and search
  const filteredTransactions = transactions
    .filter(tx => filter === 'all' || tx.type === filter)
    .filter(tx => 
      searchQuery === '' || 
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.timestamp - a.timestamp;
      } else {
        return Number(b.amount - a.amount);
      }
    });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'STAKE': return '🔒';
      case 'UNSTAKE': return '🔓';
      case 'CLAIM_REWARDS': return '🎁';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STAKE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'UNSTAKE': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CLAIM_REWARDS': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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
          <p className="text-gray-600">Please connect your wallet to view your transaction history</p>
        </Card>
      </div>
    );
  }

  if (!isStakingSupported()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">History Not Available</h2>
          <p className="text-gray-600">Staking contracts are not deployed on this network</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">📜 Staking History</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} disabled={filteredTransactions.length === 0} variant="outline">
            📥 Export CSV
          </Button>
          <Button onClick={loadTransactionHistory} disabled={loading} variant="outline">
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">🔍 Search</label>
            <input
              type="text"
              placeholder="Search by hash or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by Type */}
          <div>
            <label className="block text-sm font-medium mb-2">📋 Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="STAKE">Stake</option>
              <option value="UNSTAKE">Unstake</option>
              <option value="CLAIM_REWARDS">Claim Rewards</option>
            </select>
          </div>

          {/* Sort by */}
          <div>
            <label className="block text-sm font-medium mb-2">🔽 Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date (Newest)</option>
              <option value="amount">Amount (Highest)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Transactions</div>
          <div className="text-2xl font-bold">{transactions.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Stakes</div>
          <div className="text-2xl font-bold text-purple-600">
            {activeStakes.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Staked</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatEther(transactions
              .filter(tx => tx.type === 'STAKE')
              .reduce((sum, tx) => sum + tx.amount, 0n)
            )} CELO
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Rewards Claimed</div>
          <div className="text-2xl font-bold text-green-600">
            {formatEther(transactions
              .filter(tx => tx.type === 'CLAIM_REWARDS')
              .reduce((sum, tx) => sum + tx.amount, 0n)
            )} CELO
          </div>
        </Card>
      </div>

      {/* Active Stakes Section */}
      {activeStakes.length > 0 && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-xl font-bold mb-4">🔒 Active Stakes</h2>
          <div className="space-y-3">
            {activeStakes.map((stake: any, index: number) => {
              const amount = stake.amount || stake[0] || 0n;
              const startTime = stake.startTime || stake[1] || 0n;
              const duration = stake.duration || stake[2] || 0n;
              const rewardRate = stake.rewardRate || stake[3] || 0n;
              const unlockTime = Number(startTime) + Number(duration);
              const isLocked = Date.now() / 1000 < unlockTime;
              
              return (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">
                        {formatEther(amount)} CELO
                      </div>
                      <div className="text-sm text-gray-600">
                        Staked: {new Date(Number(startTime) * 1000).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration: {(Number(duration) / 86400).toFixed(0)} days
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isLocked 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isLocked ? '🔒 Locked' : '✅ Unlocked'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {isLocked 
                          ? `Unlocks: ${new Date(unlockTime * 1000).toLocaleDateString()}`
                          : 'Can unstake now'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center">
            <div className="text-gray-600">Loading transactions...</div>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-xl mb-2">No transactions found</div>
            <div className="text-gray-600">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start staking to see your transaction history!'}
            </div>
          </Card>
        ) : (
          filteredTransactions.map((tx, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">{getTypeIcon(tx.type)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(tx.type)}`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(tx.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 truncate">
                      Tx: <a 
                        href={`https://celo-sepolia.blockscout.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold">
                    {tx.type === 'UNSTAKE' || tx.type === 'CLAIM_REWARDS' ? '+' : '-'}
                    {formatEther(tx.amount)}
                  </div>
                  <div className="text-sm text-gray-600">CELO</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
