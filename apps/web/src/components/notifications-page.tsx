'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, parseAbiItem } from 'viem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContractAddresses } from '@/utils/celo-config';
import { getUserStakes, isStakingSupported } from '@/utils/staking-helpers';

interface Notification {
  id: string;
  type: 'unlock' | 'reward' | 'balance' | 'transaction';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    setMounted(true);
    // Load notifications from localStorage
    const saved = localStorage.getItem(`notifications_${address}`);
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, [address]);

  useEffect(() => {
    if (mounted && isConnected && address && isStakingSupported()) {
      checkForNotifications();
      // Check every minute
      const interval = setInterval(checkForNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [mounted, isConnected, address]);

  // Watch for staking events
  const contracts = getContractAddresses();
  if (contracts && isConnected) {
    useWatchContractEvent({
      address: contracts.staking as `0x${string}`,
      abi: [parseAbiItem('event Staked(address indexed user, uint256 amount, uint256 duration, uint256 rewardRate)')],
      eventName: 'Staked',
      onLogs: (logs) => {
        const userLogs = logs.filter(log => (log.args as any).user?.toLowerCase() === address?.toLowerCase());
        if (userLogs.length > 0) {
          const log = userLogs[0];
          addNotification({
            type: 'transaction',
            title: '✅ Stake Successful',
            message: `You staked ${formatEther((log.args as any).amount || 0n)} CELO successfully!`,
            action: () => window.location.href = '/staking',
            actionLabel: 'View Stakes',
          });
        }
      },
    });

    useWatchContractEvent({
      address: contracts.staking as `0x${string}`,
      abi: [parseAbiItem('event RewardsClaimed(address indexed user, uint256 amount)')],
      eventName: 'RewardsClaimed',
      onLogs: (logs) => {
        const userLogs = logs.filter(log => (log.args as any).user?.toLowerCase() === address?.toLowerCase());
        if (userLogs.length > 0) {
          const log = userLogs[0];
          addNotification({
            type: 'reward',
            title: '🎁 Rewards Claimed',
            message: `You claimed ${formatEther((log.args as any).amount || 0n)} CELO in rewards!`,
          });
        }
      },
    });
  }

  const checkForNotifications = async () => {
    if (!address || !publicClient) return;

    try {
      // Check for unlock reminders
      const stakes = await getUserStakes(address);
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < stakes.length; i++) {
        const stake = stakes[i];
        if (!stake.active || stake.duration === 0n) continue;

        const lockEndTime = Number(stake.startTime) + Number(stake.duration) * 86400;
        const timeUntilUnlock = lockEndTime - now;

        // Notify 24 hours before unlock
        if (timeUntilUnlock > 0 && timeUntilUnlock <= 86400) {
          const hoursLeft = Math.floor(timeUntilUnlock / 3600);
          addNotification({
            type: 'unlock',
            title: '🔓 Stake Unlocking Soon',
            message: `Your stake #${i} will unlock in ${hoursLeft} hours!`,
            action: () => window.location.href = '/staking',
            actionLabel: 'View Stake',
          });
        }
        // Notify when unlocked
        else if (timeUntilUnlock <= 0 && timeUntilUnlock > -86400) {
          addNotification({
            type: 'unlock',
            title: '🎉 Stake Unlocked',
            message: `Your stake #${i} is now unlocked! You can unstake anytime.`,
            action: () => window.location.href = '/staking',
            actionLabel: 'Unstake Now',
          });
        }
      }

      // Check for pending rewards
      const totalRewards = stakes.reduce((sum, stake) => {
        if (!stake.active) return sum;
        const stakingDuration = BigInt(now) - stake.startTime;
        const reward = (stake.amount * stake.rewardRate * stakingDuration) / (BigInt(365 * 24 * 60 * 60) * 10000n);
        return sum + reward;
      }, 0n);

      if (totalRewards > BigInt(1e18)) { // More than 1 CELO
        addNotification({
          type: 'reward',
          title: '💰 Rewards Available',
          message: `You have ${formatEther(totalRewards)} CELO in pending rewards!`,
          action: () => window.location.href = '/staking',
          actionLabel: 'Claim Rewards',
        });
      }

      // Check balance
      if (publicClient) {
        const balance = await publicClient.getBalance({ address });
        if (balance < BigInt(1e17)) { // Less than 0.1 CELO
          addNotification({
            type: 'balance',
            title: '⚠️ Low Balance',
            message: `Your CELO balance is low (${formatEther(balance)} CELO). You may need more for gas fees.`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => {
      // Check if similar notification exists (same title in last hour)
      const hourAgo = Date.now() - 3600000;
      const exists = prev.some(n => 
        n.title === newNotif.title && n.timestamp > hourAgo
      );
      if (exists) return prev;

      const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem(`notifications_${address}`, JSON.stringify(updated));
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(`notifications_${address}`, JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`notifications_${address}`, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem(`notifications_${address}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem(`notifications_${address}`);
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'unlock': return '🔓';
      case 'reward': return '🎁';
      case 'balance': return '⚠️';
      case 'transaction': return '✅';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'unlock': return 'bg-blue-50 border-blue-200';
      case 'reward': return 'bg-green-50 border-green-200';
      case 'balance': return 'bg-orange-50 border-orange-200';
      case 'transaction': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
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
          <p className="text-gray-600">Please connect your wallet to view notifications</p>
        </Card>
      </div>
    );
  }

  if (!isStakingSupported()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Notifications Not Available</h2>
          <p className="text-gray-600">Staking contracts are not deployed on this network</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">🔔 Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-2">You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              ✓ Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={clearAll} variant="outline">
              🗑️ Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
          >
            All ({notifications.length})
          </Button>
          <Button
            onClick={() => setFilter('unread')}
            variant={filter === 'unread' ? 'default' : 'outline'}
          >
            Unread ({unreadCount})
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold mb-3">⚙️ Notification Settings</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Unlock reminders: 24 hours before stake unlock</li>
          <li>• Reward alerts: When rewards exceed 1 CELO</li>
          <li>• Balance warnings: When CELO balance is below 0.1</li>
          <li>• Transaction updates: Real-time stake/unstake confirmations</li>
        </ul>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🔕</div>
            <div className="text-xl mb-2">No notifications</div>
            <div className="text-gray-600">
              {filter === 'unread' 
                ? 'All notifications have been read' 
                : "You're all caught up!"}
            </div>
          </Card>
        ) : (
          filteredNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`p-4 ${getTypeColor(notif.type)} ${notif.read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getTypeIcon(notif.type)}</div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{notif.title}</h3>
                      <p className="text-gray-700 mt-1">{notif.message}</p>
                    </div>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="text-gray-500 hover:text-gray-700 ml-2"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                    
                    <div className="flex gap-2">
                      {notif.action && notif.actionLabel && (
                        <Button
                          onClick={() => {
                            markAsRead(notif.id);
                            notif.action?.();
                          }}
                          size="sm"
                        >
                          {notif.actionLabel}
                        </Button>
                      )}
                      {!notif.read && (
                        <Button
                          onClick={() => markAsRead(notif.id)}
                          size="sm"
                          variant="outline"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
